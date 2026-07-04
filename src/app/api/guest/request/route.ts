import { NextResponse } from "next/server";
import { z } from "zod";
import { getCar, updateCarStatus } from "@/services/guest/store";
import { verifyGuestToken } from "@/services/guest/token";

/**
 * Guest retrieval request — replaces the legacy `update-status` Netlify
 * function, which anyone on the internet could call with any ticket ID.
 * Requires the HMAC session token minted at OTP verification; the ticket
 * comes from the token, never from the request body.
 */
const payloadSchema = z.object({
  token: z.string().min(1),
  status: z.enum(["requesting", "scheduled"]),
  scheduledTime: z.string().trim().max(20).nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid fields" },
      { status: 400 },
    );
  }
  const { token, status, scheduledTime } = parsed.data;

  const ticketId = verifyGuestToken(token);
  if (!ticketId) {
    return NextResponse.json(
      { success: false, error: "Session expired. Verify your OTP again." },
      { status: 401 },
    );
  }

  if (status === "scheduled" && !scheduledTime) {
    return NextResponse.json(
      { success: false, error: "Pick a pickup time" },
      { status: 400 },
    );
  }

  try {
    const car = await getCar(ticketId);
    if (!car) {
      return NextResponse.json({
        success: false,
        error: "This ticket is no longer active.",
      });
    }

    await updateCarStatus(ticketId, {
      status,
      ...(status === "scheduled" && scheduledTime ? { scheduledTime } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("guest/request failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not confirm. Please try again." },
      { status: 500 },
    );
  }
}
