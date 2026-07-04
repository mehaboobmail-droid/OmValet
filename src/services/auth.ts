import {
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { get, ref } from "firebase/database";
import { clientAuth, clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { StaffProfile, StaffRole } from "@/types/domain";

export interface StaffIdentity {
  role: StaffRole;
  profile: StaffProfile | null;
  displayName: string;
}

/**
 * Resolve role + profile for a signed-in user.
 * Role rule (legacy-compatible): `admins/{uid} === true` → admin, else valet.
 */
export async function fetchStaffIdentity(user: User): Promise<StaffIdentity> {
  const db = clientDb();
  const [adminSnap, profileSnap] = await Promise.all([
    get(ref(db, dbPaths.admin(user.uid))),
    get(ref(db, dbPaths.staffProfile(user.uid))),
  ]);

  const role: StaffRole = adminSnap.val() === true ? "admin" : "valet";
  const profile = (profileSnap.val() as StaffProfile | null) ?? null;

  return {
    role,
    profile,
    displayName: profile?.name || user.email || "Staff",
  };
}

/** Sign in with email/password. Throws an Error with a user-friendly message. */
export async function signInStaff(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(clientAuth(), email, password);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function signOutStaff(): Promise<void> {
  await signOut(clientAuth());
}

/** Legacy-compatible friendly messages for Firebase auth error codes. */
function mapAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check connection.";
    default:
      return "Invalid email or password";
  }
}
