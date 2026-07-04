/**
 * Single source of truth for Realtime Database paths.
 * Matches the legacy schema exactly — old and new apps are wire-compatible.
 *
 * Date keys are hotel-local (Asia/Kolkata) "YYYY-MM-DD"; month keys "YYYY-MM".
 */
export const dbPaths = {
  cars: "cars",
  car: (ticketId: string) => `cars/${ticketId}`,
  carStatus: (ticketId: string) => `cars/${ticketId}/status`,

  history: (dateKey: string) => `history/${dateKey}`,
  historyRecord: (dateKey: string, ticketId: string) =>
    `history/${dateKey}/${ticketId}`,

  activity: (dateKey: string) => `activity/${dateKey}`,
  activityEvent: (dateKey: string, ticketId: string, type: "checkin" | "checkout") =>
    `activity/${dateKey}/${ticketId}_${type}`,

  admin: (uid: string) => `admins/${uid}`,
  staff: "valets",
  staffProfile: (uid: string) => `valets/${uid}`,

  ticketCounter: "meta/ticketCounter",
  checkedOutCount: "meta/checkedOutCount",
  slotConfig: "meta/slotConfig",

  shiftTypes: "shiftTypes",
  shiftType: (id: string) => `shiftTypes/${id}`,
  shiftsMonth: (monthKey: string) => `shifts/${monthKey}`,
  shiftsDay: (monthKey: string, day: string) => `shifts/${monthKey}/${day}`,
  shiftSlot: (monthKey: string, day: string, shiftTypeId: string) =>
    `shifts/${monthKey}/${day}/${shiftTypeId}`,
} as const;
