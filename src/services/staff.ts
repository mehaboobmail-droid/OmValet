import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import { ref, remove, set, update } from "firebase/database";
import { clientAuth, clientDb } from "@/firebase/client";
import { firebaseConfig } from "@/firebase/config";
import { dbPaths } from "@/firebase/paths";
import type { Car } from "@/types/domain";
import type { CreateStaffInput } from "@/types/schemas";

/**
 * Staff management. Primary path: Admin-SDK API routes (full fidelity —
 * real deletion, password changes). When the server has no
 * FIREBASE_SERVICE_ACCOUNT yet (503), each call degrades gracefully and the
 * result carries a `warning` so the UI can be honest about what happened.
 */

export interface StaffActionResult {
  ok: boolean;
  error?: string;
  warning?: string;
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await clientAuth().currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Create ──────────────────────────────────────────────────────────

export async function createStaff(input: CreateStaffInput): Promise<StaffActionResult> {
  try {
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(input),
    });
    if (res.status === 503) return createStaffViaSecondaryApp(input);
    const data = (await res.json()) as { success?: boolean; error?: string };
    return data.success
      ? { ok: true }
      : { ok: false, error: data.error ?? "Could not create the account" };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}

/**
 * Pre-credentials fallback: create the user on an isolated secondary
 * Firebase app so the admin's own session is untouched (the legacy code
 * used the main auth instance and silently signed the admin out).
 */
async function createStaffViaSecondaryApp(
  input: CreateStaffInput,
): Promise<StaffActionResult> {
  const app =
    getApps().find((a) => a.name === "staff-mgmt") ??
    initializeApp(firebaseConfig, "staff-mgmt");
  const secondaryAuth = getAuth(app);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email,
      input.password,
    );
    await set(ref(clientDb(), dbPaths.staffProfile(cred.user.uid)), {
      name: input.name,
      email: input.email,
      empId: input.empId,
      phone: input.phone,
      createdAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "auth/email-already-in-use")
      return { ok: false, error: "Email already has an account" };
    if (code === "auth/invalid-email")
      return { ok: false, error: "Invalid email address" };
    return { ok: false, error: "Could not create the account" };
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
  }
}

// ── Update ──────────────────────────────────────────────────────────

export interface UpdateStaffFields {
  name: string;
  empId: string;
  phone: string;
  notes: string;
  password?: string;
}

export async function updateStaff(
  uid: string,
  fields: UpdateStaffFields,
  activeCars: Record<string, Car>,
): Promise<StaffActionResult> {
  try {
    const res = await fetch(`/api/admin/staff/${uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(fields),
    });
    if (res.status === 503) return updateStaffClientSide(uid, fields, activeCars);
    const data = (await res.json()) as { success?: boolean; error?: string };
    return data.success
      ? { ok: true }
      : { ok: false, error: data.error ?? "Could not save changes" };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}

/** Fallback: profile + car-name propagation work; password cannot. */
async function updateStaffClientSide(
  uid: string,
  fields: UpdateStaffFields,
  activeCars: Record<string, Car>,
): Promise<StaffActionResult> {
  const db = clientDb();
  await update(ref(db, dbPaths.staffProfile(uid)), {
    name: fields.name,
    empId: fields.empId,
    phone: fields.phone,
    notes: fields.notes,
  });

  const carUpdates: Record<string, string> = {};
  for (const [carId, car] of Object.entries(activeCars)) {
    if (car.valetUid === uid)
      carUpdates[`${dbPaths.car(carId)}/valetName`] = fields.name;
  }
  if (Object.keys(carUpdates).length > 0) {
    await update(ref(db), carUpdates);
  }

  return {
    ok: true,
    warning: fields.password
      ? "Profile saved — password unchanged (needs server credentials)"
      : undefined,
  };
}

// ── Delete ──────────────────────────────────────────────────────────

export async function deleteStaff(uid: string): Promise<StaffActionResult> {
  try {
    const res = await fetch(`/api/admin/staff/${uid}`, {
      method: "DELETE",
      headers: await authHeader(),
    });
    if (res.status === 503) {
      // Legacy-equivalent fallback: profile removed, login remains.
      await remove(ref(clientDb(), dbPaths.staffProfile(uid)));
      return {
        ok: true,
        warning:
          "Profile removed — the login still exists until server credentials are configured",
      };
    }
    const data = (await res.json()) as { success?: boolean; error?: string };
    return data.success
      ? { ok: true }
      : { ok: false, error: data.error ?? "Could not delete the account" };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}
