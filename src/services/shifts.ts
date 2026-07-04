import { ref, remove, set } from "firebase/database";
import { clientAuth, clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { ShiftType } from "@/types/domain";
import type { ShiftTypeInput } from "@/types/schemas";

/** Save (create or edit) a shift type definition. */
export async function saveShiftType(
  input: ShiftTypeInput,
  existingId?: string,
): Promise<string> {
  const id = existingId ?? `st_${Date.now()}`;
  await set(ref(clientDb(), dbPaths.shiftType(id)), { id, ...input });
  return id;
}

export async function deleteShiftType(id: string): Promise<void> {
  await remove(ref(clientDb(), dbPaths.shiftType(id)));
}

/** Assign a valet to a shift slot on a date ("YYYY-MM-DD"). */
export async function assignShift(
  dateKey: string,
  shiftType: ShiftType,
  valet: { uid: string; name: string },
): Promise<void> {
  const monthKey = dateKey.slice(0, 7);
  const day = dateKey.slice(8, 10);
  await set(ref(clientDb(), dbPaths.shiftSlot(monthKey, day, shiftType.id)), {
    valetUid: valet.uid,
    valetName: valet.name,
    shiftName: shiftType.name,
    start: shiftType.start,
    end: shiftType.end,
    color: shiftType.color,
    assignedAt: new Date().toISOString(),
  });
}

export async function unassignShift(
  dateKey: string,
  shiftTypeId: string,
): Promise<void> {
  const monthKey = dateKey.slice(0, 7);
  const day = dateKey.slice(8, 10);
  await remove(ref(clientDb(), dbPaths.shiftSlot(monthKey, day, shiftTypeId)));
}

/**
 * Shift confirmation SMS (best-effort — assignment itself never fails on
 * SMS problems, matching the check-in SMS contract).
 */
export async function sendShiftSms(params: {
  phone: string;
  valetName: string;
  shiftName: string;
  dateKey: string;
  start: string;
  end: string;
}): Promise<boolean> {
  try {
    const token = await clientAuth().currentUser?.getIdToken();
    if (!token) return false;
    const res = await fetch("/api/sms/shift", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!data.success) console.error("Shift SMS failed:", data.error);
    return data.success === true;
  } catch {
    return false;
  }
}
