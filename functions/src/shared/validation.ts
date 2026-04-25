import {Timestamp} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";

export function requiredString(value: unknown, name: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpsError("invalid-argument", `${name} is required.`);
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function optionalNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function optionalDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpsError("invalid-argument", "Invalid date value.");
  }

  return Timestamp.fromDate(date);
}

export function sanitizeExtension(value: string) {
  const extension = value.toLowerCase().replace(/^\./, "");
  if (!/^[a-z0-9]+$/.test(extension)) {
    return "jpg";
  }

  return extension;
}
