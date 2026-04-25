import {HttpsError, onCall} from "firebase-functions/v2/https";
import {assertAdmin} from "./shared/auth";
import {db} from "./shared/firebase";
import {s3Secrets, signedGetUrl} from "./shared/s3";
import {requiredString} from "./shared/validation";

type GetHighResolutionImageData = {
  imageId?: unknown;
};

export const getHighResolutionImage = onCall(
  {
    region: "asia-northeast1",
    secrets: s3Secrets,
  },
  async (request) => {
    await assertAdmin(request.auth?.uid);

    const data = request.data as GetHighResolutionImageData;
    const imageId = requiredString(data.imageId, "imageId");
    const imageSnapshot = await db.collection("images").doc(imageId).get();

    if (!imageSnapshot.exists) {
      throw new HttpsError("not-found", "Image was not found.");
    }

    const image = imageSnapshot.data();
    const originalKey = image?.originalKey;

    if (
      typeof originalKey !== "string" ||
      !originalKey.startsWith("private/originals/")
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Image original is not available.",
      );
    }

    const signedUrl = await signedGetUrl(originalKey);
    const expiresAt = new Date(Date.now() + signedUrl.expiresIn * 1000)
      .toISOString();

    return {
      imageId,
      url: signedUrl.url,
      expiresAt,
    };
  },
);
