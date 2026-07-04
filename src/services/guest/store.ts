import "server-only";
import { adminDb } from "@/firebase/admin";
import { firebaseConfig } from "@/firebase/config";
import { dbPaths } from "@/firebase/paths";
import type { Car } from "@/types/domain";

/**
 * Server-side car access for the guest flow.
 *
 * Preferred backend: Firebase Admin SDK (FIREBASE_SERVICE_ACCOUNT set).
 * Fallback backend: RTDB REST — works while the legacy public rules are
 * still deployed, so the guest flow functions before the credentials land.
 * Once the hardened rules ship (final milestone), the service account is
 * mandatory and the fallback naturally stops working.
 */
const hasAdminCredentials = () => Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);

const restUrl = (path: string) => `${firebaseConfig.databaseURL}/${path}.json`;

export async function getCar(ticketId: string): Promise<Car | null> {
  if (hasAdminCredentials()) {
    const snap = await adminDb().ref(dbPaths.car(ticketId)).get();
    return (snap.val() as Car | null) ?? null;
  }
  const res = await fetch(restUrl(dbPaths.car(ticketId)), { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Car | null;
}

/** Legacy no-ticket flow: find the active car matching an OTP (first match). */
export async function findCarByOtp(otp: string): Promise<Car | null> {
  let cars: Record<string, Car> | null;
  if (hasAdminCredentials()) {
    const snap = await adminDb().ref(dbPaths.cars).get();
    cars = snap.val() as Record<string, Car> | null;
  } else {
    const res = await fetch(restUrl(dbPaths.cars), { cache: "no-store" });
    cars = res.ok ? ((await res.json()) as Record<string, Car> | null) : null;
  }
  if (!cars) return null;
  return (
    Object.values(cars).find(
      (car) => String(car.otp).trim() === otp,
    ) ?? null
  );
}

export async function updateCarStatus(
  ticketId: string,
  data: { status: "requesting" | "scheduled"; scheduledTime?: string },
): Promise<void> {
  if (hasAdminCredentials()) {
    await adminDb().ref(dbPaths.car(ticketId)).update(data);
    return;
  }
  const res = await fetch(restUrl(dbPaths.car(ticketId)), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Could not update retrieval status");
}
