import {FieldValue} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {assertAdmin} from "./shared/auth";
import {db} from "./shared/firebase";
import {
  optionalString,
  optionalStringArray,
  requiredString,
} from "./shared/validation";

type UpdateImageMetadataData = {
  imageId?: unknown;
  title?: unknown;
  description?: unknown;
  tags?: unknown;
};

export const updateImageMetadata = onCall(
  {region: "asia-northeast1"},
  async (request) => {
    await assertAdmin(request.auth?.uid);

    const data = request.data as UpdateImageMetadataData;
    const imageId = requiredString(data.imageId, "imageId");
    const title = requiredString(data.title, "title");
    const description = optionalString(data.description);
    const tags = optionalStringArray(data.tags);
    const imageRef = db.collection("images").doc(imageId);
    const imageSnapshot = await imageRef.get();

    if (!imageSnapshot.exists) {
      throw new HttpsError("not-found", "Image was not found.");
    }

    await imageRef.update({
      title,
      description,
      tags,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      imageId,
      title,
      description,
      tags,
    };
  },
);
