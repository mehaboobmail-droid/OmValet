/**
 * Domain model — mirrors the existing Firebase Realtime Database structure
 * exactly, so the new app is wire-compatible with the legacy HTML system.
 */

/** Lifecycle of an active vehicle. Checked-out cars move to `history` as `done`. */
export type CarStatus = "parked" | "requesting" | "scheduled" | "ready";

/** Active vehicle record at `cars/{ticketId}`. */
export interface Car {
  /** Ticket ID, e.g. "V-1042" — also the DB key. */
  id: string;
  guest: string;
  room: string;
  plate: string;
  make: string;
  model: string;
  color: string;
  slot: string;
  phone: string;
  notes: string;
  /** 4-digit guest verification code. Never exposed to unauthenticated clients. */
  otp: string;
  /** Display time of check-in, e.g. "02:41 PM". */
  time: string;
  /** ISO timestamp of check-in. */
  timestamp: string;
  status: CarStatus;
  valetUid: string;
  valetName: string;
  /** Present when a guest schedules a later pickup, e.g. "03:20 PM". */
  scheduledTime?: string;
  /** Set when a valet marks the car ready. */
  retrievedBy?: string;
  retrievedByUid?: string;
}

/** Permanent record at `history/{checkinDate}/{ticketId}`, written at checkout. */
export interface HistoryRecord extends Omit<Car, "status"> {
  status: "done";
  /** Display time of checkout, e.g. "05:12 PM". */
  timeOut: string;
  /** ISO timestamp of checkout. */
  timestampOut: string;
  retrievedBy: string;
  retrievedByUid: string;
}

/**
 * What a verified guest is allowed to see — the server strips OTP, phone,
 * valet identifiers and internal notes before responding.
 */
export type GuestCar = Pick<
  Car,
  | "id"
  | "plate"
  | "make"
  | "model"
  | "color"
  | "guest"
  | "room"
  | "slot"
  | "time"
  | "status"
  | "scheduledTime"
>;

export type ActivityEventType = "checkin" | "checkout";

/** Event at `activity/{date}/{ticketId}_{type}` powering the admin report. */
export interface ActivityEvent {
  type: ActivityEventType;
  ticketId: string;
  plate: string;
  guest: string;
  slot: string;
  valetUid: string;
  valetName: string;
  time: string;
  timestamp: string;
  room?: string;
  make?: string;
  model?: string;
  color?: string;
  notes?: string;
  status?: string;
  retrievedBy?: string;
  retrievedByUid?: string;
}

/** Staff profile at `valets/{uid}`. Admins additionally have `admins/{uid} === true`. */
export interface StaffProfile {
  name: string;
  email: string;
  empId: string;
  phone: string;
  notes?: string;
  createdAt: string;
}

export type StaffRole = "admin" | "valet";

/** Parking grid configuration at `meta/slotConfig`. */
export interface SlotConfig {
  /** Comma-separated row letters, e.g. "A, B, C, D". */
  rows: string;
  perRow: number;
}

/** Shift template at `shiftTypes/{id}`. */
export interface ShiftType {
  id: string;
  name: string;
  /** 24h "HH:MM". */
  start: string;
  end: string;
  /** Hex colour used on the calendar. */
  color: string;
}

/** Assignment at `shifts/{YYYY-MM}/{DD}/{shiftTypeId}`. */
export interface ShiftAssignment {
  valetUid: string;
  valetName: string;
  shiftName: string;
  start: string;
  end: string;
  color: string;
  assignedAt: string;
}

/** Map of shiftTypeId → assignment for a single day. */
export type DayShifts = Record<string, ShiftAssignment>;
