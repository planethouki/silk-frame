import {randomBytes} from "crypto";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {assertAdmin} from "./shared/auth";
import {publicUrl} from "./shared/cloudfront";
import {db} from "./shared/firebase";
import {s3Secrets, signedPutUrl} from "./shared/s3";
import {
  optionalDate,
  optionalNumber,
  optionalString,
  optionalStringArray,
  requiredString,
  sanitizeExtension,
} from "./shared/validation";

type CreateImageUploadData = {
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  visibility?: unknown;
  originalContentType?: unknown;
  originalExtension?: unknown;
  originalFileName?: unknown;
  width?: unknown;
  height?: unknown;
  takenAt?: unknown;
  sortAt?: unknown;
};

const staleUploadingMaxAgeMs = 24 * 60 * 60 * 1000;
const staleUploadingCleanupLimit = 25;

const imageIdTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function imageIdTimestamp(date: Date) {
  const parts = new Map(
    imageIdTimeFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return [
    parts.get("year"),
    parts.get("month"),
    parts.get("day"),
    "-",
    parts.get("hour"),
    parts.get("minute"),
  ].join("");
}

function slugFromFileName(fileName: string) {
  const name = fileName.split(/[\\/]/).pop() || "";
  const baseName = name.replace(/\.[^.]*$/, "");
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");

  return slug || "img";
}

function imageIdCandidate(fileName: string) {
  return [
    imageIdTimestamp(new Date()),
    slugFromFileName(fileName),
    randomBytes(2).toString("hex"),
  ].join("-");
}

function keysForImageId(imageId: string, originalExtension: string) {
  const originalKey = `private/originals/${imageId}.${originalExtension}`;
  const displayKey = `public/display/${imageId}.webp`;
  const thumbKey = `public/thumbs/${imageId}.webp`;

  return {
    originalKey,
    displayKey,
    thumbKey,
    displayUrl: publicUrl(displayKey),
    thumbUrl: publicUrl(thumbKey),
  };
}

async function cleanupStaleUploadingImages() {
  const cutoff = Timestamp.fromMillis(Date.now() - staleUploadingMaxAgeMs);
  const snapshot = await db
    .collection("images")
    .where("status", "==", "uploading")
    .where("createdAt", "<", cutoff)
    .orderBy("createdAt", "asc")
    .limit(staleUploadingCleanupLimit)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  logger.info("Cleaned up stale uploading image documents.", {
    count: snapshot.size,
  });
}

export const createImageUpload = onCall(
  {
    region: "asia-northeast1",
    secrets: s3Secrets,
  },
  async (request) => {
    await assertAdmin(request.auth?.uid);

    try {
      await cleanupStaleUploadingImages();
    } catch (caughtError) {
      logger.warn("Failed to clean up stale uploading image documents.", {
        error: caughtError,
      });
    }

    const data = request.data as CreateImageUploadData;
    const title = requiredString(data.title, "title");
    const description = optionalString(data.description);
    const tags = optionalStringArray(data.tags);
    const visibility = data.visibility === "private" ? "private" : "public";
    const originalContentType = requiredString(
      data.originalContentType,
      "originalContentType",
    );
    const originalExtension = sanitizeExtension(
      requiredString(data.originalExtension, "originalExtension"),
    );
    const originalFileName = optionalString(data.originalFileName);
    const width = optionalNumber(data.width, 0);
    const height = optionalNumber(data.height, 0);
    const now = FieldValue.serverTimestamp();
    const sortAt = optionalDate(data.sortAt) || now;
    const takenAt = optionalDate(data.takenAt);

    const imageData = {
      title,
      description,
      tags,
      visibility,
      status: "uploading",
      width,
      height,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      takenAt: takenAt || sortAt,
      sortAt,
    };

    let imageId = "";
    let keys = keysForImageId("pending", originalExtension);
    let created = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      imageId = imageIdCandidate(originalFileName);
      keys = keysForImageId(imageId, originalExtension);
      const imageRef = db.collection("images").doc(imageId);

      try {
        await imageRef.create({
          ...imageData,
          ...keys,
        });
        created = true;
        break;
      } catch (caughtError) {
        const code = (caughtError as {code?: number | string}).code;
        if (code !== 6 && code !== "already-exists") {
          throw caughtError;
        }
      }
    }

    if (!created) {
      throw new HttpsError("already-exists", "Could not allocate imageId.");
    }

    return {
      imageId,
      keys: {
        originalKey: keys.originalKey,
        displayKey: keys.displayKey,
        thumbKey: keys.thumbKey,
      },
      publicUrls: {
        displayUrl: keys.displayUrl,
        thumbUrl: keys.thumbUrl,
      },
      uploadUrls: {
        original: await signedPutUrl(
          keys.originalKey,
          originalContentType,
          "original",
        ),
        display: await signedPutUrl(keys.displayKey, "image/webp", "display"),
        thumb: await signedPutUrl(keys.thumbKey, "image/webp", "thumb"),
      },
    };
  },
);
