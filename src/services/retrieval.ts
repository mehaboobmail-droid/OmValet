import { increment, ref, remove, set, update } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { Car, HistoryRecord } from "@/types/domain";
import { formatTime, localDateKey } from "@/utils/date";

interface ValetIdentity {
  uid: string;
  name: string;
}

/** Mark a requested car as ready at the porch, recording who retrieved it. */
export async function markCarReady(car: Car, valet: ValetIdentity): Promise<void> {
  await update(ref(clientDb(), dbPaths.car(car.id)), {
    status: "ready",
    retrievedBy: valet.name,
    retrievedByUid: valet.uid,
  });
}

/**
 * Hand the car over:
 *  1. Persist the full record to `history/{checkinDate}/{id}` (permanent).
 *  2. Log the checkout event to `activity/{checkinDate}` (report engine
 *     merges both events of a ticket under its check-in date — legacy rule).
 *  3. Remove from active `cars`.
 *  4. Bump `meta/checkedOutCount` atomically (legacy read-then-write raced).
 */
export async function checkOutVehicle(
  car: Car,
  valet: ValetIdentity,
): Promise<void> {
  const db = clientDb();
  const now = new Date();
  const timeOut = formatTime(now);
  const checkinDate = car.timestamp
    ? localDateKey(new Date(car.timestamp))
    : localDateKey(now);

  const retrievedBy = car.retrievedBy || valet.name || "—";
  const retrievedByUid = car.retrievedByUid || valet.uid || "—";

  const record: HistoryRecord = {
    ...car,
    timeOut,
    timestampOut: now.toISOString(),
    retrievedBy,
    retrievedByUid,
    status: "done",
  };

  await set(ref(db, dbPaths.historyRecord(checkinDate, car.id)), record);

  await set(ref(db, dbPaths.activityEvent(checkinDate, car.id, "checkout")), {
    type: "checkout",
    ticketId: car.id,
    plate: car.plate,
    guest: car.guest,
    room: car.room,
    slot: car.slot,
    make: car.make,
    model: car.model,
    color: car.color,
    notes: car.notes,
    valetUid: car.valetUid,
    valetName: car.valetName,
    retrievedBy,
    retrievedByUid,
    time: timeOut,
    timestamp: record.timestampOut,
  });

  await remove(ref(db, dbPaths.car(car.id)));
  await set(ref(db, dbPaths.checkedOutCount), increment(1));
}
