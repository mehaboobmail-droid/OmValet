import {
  sendPasswordResetEmail,
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
  /**
   * Whether this account is provisioned staff. True only for admins or users
   * with a `valets/{uid}` profile — authenticating alone is not enough, so a
   * self-registered stranger cannot reach the portal.
   */
  isStaff: boolean;
  profile: StaffProfile | null;
  displayName: string;
}

/**
 * Resolve role + profile for a signed-in user.
 * Role rule (legacy-compatible): `admins/{uid} === true` → admin, else valet.
 * Staff membership additionally requires the admin flag or a staff profile.
 */
export async function fetchStaffIdentity(user: User): Promise<StaffIdentity> {
  const db = clientDb();
  const [adminSnap, profileSnap] = await Promise.all([
    get(ref(db, dbPaths.admin(user.uid))),
    get(ref(db, dbPaths.staffProfile(user.uid))),
  ]);

  const isAdmin = adminSnap.val() === true;
  const profile = (profileSnap.val() as StaffProfile | null) ?? null;

  return {
    role: isAdmin ? "admin" : "valet",
    isStaff: isAdmin || profile !== null,
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

/**
 * Send a Firebase password-reset email. Privacy-preserving: resolves the same
 * way whether or not the address is registered (never reveals which emails
 * exist), surfacing an error only for a malformed address or rate limiting.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(clientAuth(), email);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "auth/invalid-email") {
      throw new Error("Enter a valid email address");
    }
    if (code === "auth/too-many-requests") {
      throw new Error("Too many attempts. Try again later.");
    }
    // auth/user-not-found and others → swallow (don't reveal account existence).
  }
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
