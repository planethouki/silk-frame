import {defineString} from "firebase-functions/params";

export const awsRegion = defineString("AWS_REGION", {
  default: "ap-northeast-1",
});
export const s3Bucket = defineString("S3_BUCKET");
export const cloudFrontBaseUrl = defineString("CLOUDFRONT_BASE_URL");
export const cloudFrontPublicPathPrefix = defineString(
  "CLOUDFRONT_PUBLIC_PATH_PREFIX",
  {default: ""},
);
