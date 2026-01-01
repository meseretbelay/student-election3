// app/lib/adminAuth.ts

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Reauthenticates the current user with their password.
 * Used to confirm sensitive admin actions (add/edit/delete/reset).
 *
 * @param password - The admin's current password
 * @throws Error if not logged in or wrong password
 */
export async function confirmAdminPassword(password: string): Promise<void> {
  const user: User | null = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user found.");
  }

  if (!user.email) {
    throw new Error("User email is missing.");
  }

  const credential = EmailAuthProvider.credential(user.email, password);

  try {
    await reauthenticateWithCredential(user, credential);
  } catch (error: any) {
    if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    }
    throw new Error("Password confirmation failed.");
  }
}