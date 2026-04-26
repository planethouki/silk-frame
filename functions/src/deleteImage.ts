import {HttpsError, onCall} from "firebase-functions/v2/https";
import {assertAdmin} from "./shared/auth";
import {db} from "./shared/firebase";
import {deletePublicObjects, s3Secrets} from "./shared/s3";
import {requiredString} from "./shared/validation";

type DeleteImageData = {
  imageId?: unknown;
};

function optionalPublicKey(value: unknown) {
  return typeof value === "string" && value.startsWith("public/") ? value : "";
}

export const deleteImage = onCall(
  {
    region: "asia-northeast1",
    secrets: s3Secrets,
  },
  async (request) => {
    await assertAdmin(request.auth?.uid);

    const data = request.data as DeleteImageData;
    const imageId = requiredString(data.imageId, "imageId");
    const imageRef = db.collection("images").doc(imageId);
    const imageSnapshot = await imageRef.get();

    if (!imageSnapshot.exists) {
      throw new HttpsError("not-found", "Image was not found.");
    }

    const image = imageSnapshot.data() ?? {};
    const displayKey = optionalPublicKey(image.displayKey);
    const thumbKey = optionalPublicKey(image.thumbKey);

    await deletePublicObjects([displayKey, thumbKey]);
    await imageRef.delete();

    return {
      imageId,
      deletedPublicKeys: [displayKey, thumbKey].filter(Boolean),
    };
  },
);
