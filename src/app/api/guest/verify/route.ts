import { NextResponse } from "next/server";
import { toGuestCar } from "@/services/guest/sanitize";
import { findCarByOtp, getCar } from "@/services/guest/store";
import { mintGuestToken } from "@/services/guest/token";
import { verifyOtpSchema } from "@/types/schemas";

/**
 * Guest OTP verification — server-side (legacy compared OTPs in the browser,
 * which required the whole `cars` node, OTPs included, to be world-readable).
 *
 * Best-effort per-IP rate limit to slow 4-digit brute force. In-memory, so
 * per serverless instance — a real abuse problem would warrant a shared
 * store, but this already beats the legacy (no limit, data fully public).
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Enter the 4-digit OTP" },
      { status: 400 },
    );
  }
  const { ticketId, otp } = parsed.data;

  try {
    if (ticketId) {
      const car = await getCar(ticketId);
      if (!car) {
        return NextResponse.json({
          success: false,
          error: "Ticket not found. Please contact valet staff.",
        });
      }
      if (String(car.otp).trim() !== otp) {
        return NextResponse.json({
          success: false,
          error: "Wrong OTP. Please check your SMS and try again.",
        });
      }
      return NextResponse.json({
        success: true,
        car: toGuestCar(car),
        token: mintGuestToken(car.id),
      });
    }

    // No ticket in the link — search by OTP (legacy behaviour, now server-side).
    const match = await findCarByOtp(otp);
    if (!match) {
      return NextResponse.json({
        success: false,
        error: "Wrong OTP. Please check your SMS and try again.",
      });
    }
    return NextResponse.json({
      success: true,
      car: toGuestCar(match),
      token: mintGuestToken(match.id),
    });
  } catch (error) {
    console.error("guest/verify failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
