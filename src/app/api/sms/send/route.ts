import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/firebase/admin";
import { sendSms } from "@/services/twilio";
import { otpSchema, phoneSchema, ticketIdSchema } from "@/types/schemas";

/**
 * Send the guest check-in SMS (ticket + OTP + guest link) via Twilio.
 *
 * Security (fixes two legacy holes):
 *  - Requires a verified staff Firebase ID token — the legacy endpoint was
 *    publicly callable and could burn SMS credit.
 *  - Credentials live in TWILIO_* env vars — the legacy key was
 *    hard-coded in the repo.
 *  - The message is composed server-side from validated fields only.
 */
const payloadSchema = z.object({
  phone: phoneSchema,
  ticketId: ticketIdSchema,
  otp: otpSchema,
});

export async function POST(request: Request) {
  // ── AuthN: any signed-in staff member ──
  const bearer = request.headers.get("authorization") ?? "";
  const idToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    await adminAuth().verifyIdToken(idToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("FIREBASE_SERVICE_ACCOUNT")) {
      return NextResponse.json(
        { success: false, error: "SMS service not configured on server" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // ── Validate payload ──
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid fields" },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { success: false, error: "SMS service not configured on server" },
      { status: 503 },
    );
  }

  const { phone, ticketId, otp } = parsed.data;
  // Legacy message format, link composed server-side.
  const message = `Valet:Ticket ${ticketId} OTP ${otp} ${appUrl}/guest?ticket=${ticketId}`;

  const result = await sendSms(phone, message);
  if (result.error === "SMS service not configured on server") {
    return NextResponse.json(result, { status: 503 });
  }
  return NextResponse.json(result);
}
