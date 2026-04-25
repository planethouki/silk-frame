import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {defineSecret} from "firebase-functions/params";
import {HttpsError} from "firebase-functions/v2/https";
import {awsRegion, s3Bucket} from "./params";

type UploadVariant = "original" | "display" | "thumb";

export const awsAccessKeyId = defineSecret("AWS_ACCESS_KEY_ID");
export const awsSecretAccessKey = defineSecret("AWS_SECRET_ACCESS_KEY");
export const s3Secrets = [awsAccessKeyId, awsSecretAccessKey];

function ensureS3Config() {
  if (!awsRegion.value() || !s3Bucket.value()) {
    throw new HttpsError(
      "failed-precondition",
      "AWS_REGION and S3_BUCKET must be configured.",
    );
  }
}

export async function signedPutUrl(
  key: string,
  contentType: string,
  variant: UploadVariant,
) {
  ensureS3Config();

  const s3Client = new S3Client({
    region: awsRegion.value(),
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: awsAccessKeyId.value(),
      secretAccessKey: awsSecretAccessKey.value(),
    },
  });

  const command = new PutObjectCommand({
    Bucket: s3Bucket.value(),
    Key: key,
    ContentType: contentType,
    Metadata: {
      variant,
      app: "silk-frame",
    },
  });

  return getSignedUrl(s3Client, command, {expiresIn: 10 * 60});
}
