import {FieldValue} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {assertAdmin} from "./shared/auth";
import {db} from "./shared/firebase";
import {requiredString} from "./shared/validation";

type UpdateImageRatingData = {
  imageId?: unknown;
  ratingKind?: unknown;
  value?: unknown;
};

function ratingField(ratingKind: unknown) {
  if (ratingKind === "heart") return "heartRating";
  if (ratingKind === "star") return "starRating";
  throw new HttpsError("invalid-argument", "ratingKind must be heart or star.");
}

function ratingValue(value: unknown) {
  if (value === null) return null;
  if (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5) {
    return value;
  }
  throw new HttpsError("invalid-argument", "value must be null or 1-5.");
}

export const updateImageRating = onCall(
  {region: "asia-northeast1"},
  async (request) => {
    await assertAdmin(request.auth?.uid);

    const data = request.data as UpdateImageRatingData;
    const imageId = requiredString(data.imageId, "imageId");
    const field = ratingField(data.ratingKind);
    const value = ratingValue(data.value);
    const imageRef = db.collection("images").doc(imageId);
    const imageSnapshot = await imageRef.get();

    if (!imageSnapshot.exists) {
      throw new HttpsError("not-found", "Image was not found.");
    }

    await imageRef.update({
      [field]: value,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      imageId,
      ratingKind: data.ratingKind,
      value,
    };
  },
);
