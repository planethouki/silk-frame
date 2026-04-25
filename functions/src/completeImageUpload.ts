import {FieldValue} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {assertAdmin} from "./shared/auth";
import {db} from "./shared/firebase";
import {
  optionalDate,
  optionalNumber,
  requiredString,
} from "./shared/validation";

type CompleteImageUploadData = {
  imageId?: unknown;
  width?: unknown;
  height?: unknown;
  takenAt?: unknown;
  sortAt?: unknown;
};

export const completeImageUpload = onCall(
  {region: "asia-northeast1"},
  async (request) => {
    await assertAdmin(request.auth?.uid);

    const data = request.data as CompleteImageUploadData;
    const imageId = requiredString(data.imageId, "imageId");
    const width = optionalNumber(data.width, 0);
    const height = optionalNumber(data.height, 0);
    const takenAt = optionalDate(data.takenAt);
    const sortAt = optionalDate(data.sortAt);

    await db.collection("images").doc(imageId).set(
      {
        status: "ready",
        width,
        height,
        ...(takenAt ? {takenAt} : {}),
        ...(sortAt ? {sortAt} : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    return {imageId, status: "ready"};
  },
);
