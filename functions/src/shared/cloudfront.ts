import {HttpsError} from "firebase-functions/v2/https";
import {
  cloudFrontBaseUrl,
  cloudFrontPublicPathPrefix,
} from "./params";

export function publicUrl(key: string) {
  const baseUrl = cloudFrontBaseUrl.value().replace(/\/$/, "");
  if (!baseUrl) {
    throw new HttpsError(
      "failed-precondition",
      "CLOUDFRONT_BASE_URL is not configured.",
    );
  }

  const publicPathPrefix = cloudFrontPublicPathPrefix
    .value()
    .replace(/^\/|\/$/g, "");
  const publicKey = key.replace(/^public\//, "");
  const path = publicPathPrefix ?
    `${publicPathPrefix}/${publicKey}` :
    publicKey;

  return `${baseUrl}/${path}`;
}
