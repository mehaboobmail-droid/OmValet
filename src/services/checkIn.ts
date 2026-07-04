import { ref, runTransaction, set } from "firebase/database";
import { TICKET_COUNTER_START, TICKET_PREFIX } from "@/constants";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { Car } from "@/types/domain";
import type { CheckInInput } from "@/types/schemas";
import { formatTime, localDateKey } from "@/utils/date";
import { generateOtp } from "@/utils/otp";

interface ValetIdentity {
  uid: string;
  name: string;
}

/**
 * Check a vehicle in:
 *  1. Mint a ticket number via an atomic transaction on `meta/ticketCounter`
 *     (legacy used read-then-write and could issue duplicate tickets).
 *  2. Write the car record to `cars/{ticketId}`.
 *  3. Log the check-in event under the hotel-local date key.
 */
export async function checkInVehicle(
  input: CheckInInput,
  valet: ValetIdentity,
  occupiedSlots: ReadonlySet<string>,
): Promise<Car> {
  // Last-moment guard: another valet may have taken the slot mid-form.
  if (occupiedSlots.has(input.slot)) {
    throw new Error(`Slot ${input.slot} was just taken — pick another`);
  }

  const db = clientDb();

  const result = await runTransaction(
    ref(db, dbPaths.ticketCounter),
    (current: number | null) => (current ?? TICKET_COUNTER_START) + 1,
  );
  if (!result.committed) {
    throw new Error("Could not reserve a ticket number — try again");
  }

  const counter = result.snapshot.val() as number;
  const now = new Date();

  const car: Car = {
    id: `${TICKET_PREFIX}-${counter}`,
    guest: input.guest,
    room: input.room,
    plate: input.plate,
    make: input.make || "—",
    model: input.model || "—",
    color: input.color || "—",
    slot: input.slot,
    phone: input.phone,
    notes: input.notes,
    otp: generateOtp(),
    time: formatTime(now),
    timestamp: now.toISOString(),
    status: "parked",
    valetUid: valet.uid,
    valetName: valet.name,
  };

  await set(ref(db, dbPaths.car(car.id)), car);

  const dateKey = localDateKey(now);
  await set(ref(db, dbPaths.activityEvent(dateKey, car.id, "checkin")), {
    type: "checkin",
    ticketId: car.id,
    plate: car.plate,
    guest: car.guest,
    slot: car.slot,
    valetUid: valet.uid,
    valetName: valet.name,
    time: car.time,
    timestamp: car.timestamp,
  });

  return car;
}
