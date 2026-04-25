import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./firebase";

export async function assertAdmin(uid: string | undefined) {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in is required.");
  }

  const userSnapshot = await db.collection("users").doc(uid).get();
  if (userSnapshot.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role is required.");
  }
}
