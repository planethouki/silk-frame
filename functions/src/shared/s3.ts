import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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

function createS3Client() {
  return new S3Client({
    region: awsRegion.value(),
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: awsAccessKeyId.value(),
      secretAccessKey: awsSecretAccessKey.value(),
    },
  });
}

export async function signedPutUrl(
  key: string,
  contentType: string,
  variant: UploadVariant,
) {
  ensureS3Config();

  const s3Client = createS3Client();

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

export async function signedGetUrl(key: string) {
  ensureS3Config();

  const s3Client = createS3Client();

  const command = new GetObjectCommand({
    Bucket: s3Bucket.value(),
    Key: key,
    ResponseCacheControl: "private, max-age=0, no-store",
    ResponseContentDisposition: "inline",
  });

  const expiresIn = 5 * 60;

  return {
    url: await getSignedUrl(s3Client, command, {expiresIn}),
    expiresIn,
  };
}

export async function deletePublicObjects(keys: string[]) {
  ensureS3Config();

  const publicKeys = [...new Set(keys)]
    .map((key) => key.trim())
    .filter((key) => key.startsWith("public/"));

  if (publicKeys.length === 0) {
    return;
  }

  const s3Client = createS3Client();

  await Promise.all(
    publicKeys.map((key) =>
      s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3Bucket.value(),
          Key: key,
        }),
      ),
    ),
  );
}
