/** Business constants shared across the app. Values mirror the legacy system. */

/** All persisted dates/keys are computed in hotel-local time. */
export const TIMEZONE = "Asia/Kolkata";

export const TICKET_PREFIX = "V";
/** Counter seed — first issued ticket is V-1001. */
export const TICKET_COUNTER_START = 1000;

export const OTP_LENGTH = 4;
export const MIN_PASSWORD_LENGTH = 6;

/** Default parking grid when `meta/slotConfig` is absent. */
export const DEFAULT_SLOT_ROWS = "A,B,C,D";
export const DEFAULT_SLOTS_PER_ROW = 10;
export const MAX_SLOTS_PER_ROW = 30;

/** Guest scheduling: 8 options in 20-minute increments. */
export const PICKUP_SLOT_INTERVAL_MINUTES = 20;
export const PICKUP_SLOT_COUNT = 8;
/** Displayed ETA for immediate retrieval. */
export const IMMEDIATE_ETA_LABEL = "~12 min";

/** "My Schedule" horizon for valets. */
export const MY_SHIFTS_DAYS = 14;
/** Months of shift data kept live in the scheduler. */
export const SHIFT_MONTHS_WINDOW = 3;

/** Calendar colour choices for shift types. */
export const SHIFT_COLORS = [
  "#C9A84C",
  "#4CAF7A",
  "#4A8FD4",
  "#E8A43A",
  "#D94F4F",
  "#9B59B6",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  parked: "Parked",
  requesting: "Retrieval Requested",
  ready: "Ready",
  scheduled: "Scheduled",
  done: "Checked Out",
};
