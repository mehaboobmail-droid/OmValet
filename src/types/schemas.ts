import { z } from "zod";
import {
  MIN_PASSWORD_LENGTH,
  MAX_SLOTS_PER_ROW,
  OTP_LENGTH,
} from "@/constants";

/** Indian mobile: accepts 10 digits, optionally prefixed with 91 / +91. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d]/g, ""))
  .refine((v) => v.replace(/^91/, "").length === 10 || v.length === 10, {
    message: "Enter a valid 10-digit mobile number",
  });

export const otpSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `OTP must be ${OTP_LENGTH} digits`);

export const ticketIdSchema = z
  .string()
  .trim()
  .regex(/^V-\d+$/, "Invalid ticket ID");

/** Vehicle check-in form / API payload. */
export const checkInSchema = z.object({
  guest: z.string().trim().min(1, "Guest name is required").max(80),
  room: z.string().trim().min(1, "Room number is required").max(20),
  plate: z
    .string()
    .trim()
    .min(4, "License plate is required")
    .max(16)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "")),
  phone: phoneSchema,
  make: z.string().trim().max(40).default(""),
  model: z.string().trim().max(40).default(""),
  color: z.string().trim().max(30).default(""),
  notes: z.string().trim().max(300).default(""),
  slot: z.string().trim().min(1, "Select a parking slot"),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

/** Guest OTP verification. Ticket ID optional — server searches by OTP when absent. */
export const verifyOtpSchema = z.object({
  ticketId: ticketIdSchema.optional(),
  otp: otpSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/** Guest retrieval request — only these transitions are guest-reachable. */
export const guestStatusSchema = z.object({
  ticketId: ticketIdSchema,
  status: z.enum(["requesting", "scheduled"]),
  scheduledTime: z.string().trim().max(20).nullable().optional(),
});
export type GuestStatusInput = z.infer<typeof guestStatusSchema>;

/** Admin: create staff account. */
export const createStaffSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  empId: z.string().trim().max(20).default(""),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, "").slice(-10))
    .default(""),
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

/** Admin: edit staff profile (password optional — blank keeps current). */
export const updateStaffSchema = z.object({
  uid: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(60),
  empId: z.string().trim().max(20).default(""),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, "").slice(-10))
    .default(""),
  notes: z.string().trim().max(120).default(""),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .optional()
    .or(z.literal("")),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

/** Admin: parking grid configuration. */
export const slotConfigSchema = z.object({
  rows: z
    .string()
    .trim()
    .min(1, "Enter at least one row letter")
    .refine(
      (v) => v.split(",").every((r) => /^[A-Za-z]{1,3}$/.test(r.trim())),
      "Rows must be comma-separated letters, e.g. A, B, C",
    ),
  perRow: z.coerce.number().int().min(1).max(MAX_SLOTS_PER_ROW),
});
export type SlotConfigInput = z.infer<typeof slotConfigSchema>;

/** Admin: shift type definition. */
export const shiftTypeSchema = z.object({
  name: z.string().trim().min(1, "Shift name is required").max(30),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid colour"),
});
export type ShiftTypeInput = z.infer<typeof shiftTypeSchema>;
