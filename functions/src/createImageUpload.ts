import {FieldValue} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
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
  width?: unknown;
  height?: unknown;
  takenAt?: unknown;
  sortAt?: unknown;
};

export const createImageUpload = onCall(
  {
    region: "asia-northeast1",
    secrets: s3Secrets,
  },
  async (request) => {
    await assertAdmin(request.auth?.uid);

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
    const width = optionalNumber(data.width, 0);
    const height = optionalNumber(data.height, 0);
    const now = FieldValue.serverTimestamp();
    const sortAt = optionalDate(data.sortAt) || now;
    const takenAt = optionalDate(data.takenAt);

    const imageRef = db.collection("images").doc();
    const imageId = imageRef.id;
    const originalKey = `private/originals/${imageId}.${originalExtension}`;
    const displayKey = `public/display/${imageId}.webp`;
    const thumbKey = `public/thumbs/${imageId}.webp`;
    const displayUrl = publicUrl(displayKey);
    const thumbUrl = publicUrl(thumbKey);

    await imageRef.set({
      title,
      description,
      tags,
      visibility,
      status: "uploading",
      originalKey,
      displayKey,
      thumbKey,
      displayUrl,
      thumbUrl,
      width,
      height,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      takenAt: takenAt || sortAt,
      sortAt,
    });

    return {
      imageId,
      keys: {
        originalKey,
        displayKey,
        thumbKey,
      },
      publicUrls: {
        displayUrl,
        thumbUrl,
      },
      uploadUrls: {
        original: await signedPutUrl(
          originalKey,
          originalContentType,
          "original",
        ),
        display: await signedPutUrl(displayKey, "image/webp", "display"),
        thumb: await signedPutUrl(thumbKey, "image/webp", "thumb"),
      },
    };
  },
);
