import { NextResponse } from "next/server";
import { getCar } from "@/services/guest/store";
import { verifyGuestToken } from "@/services/guest/token";

/**
 * Live status for the guest tracker (polled). Token-gated so nobody can
 * watch arbitrary tickets. Returns `done` once the car leaves the active
 * pool (checked out).
 */
export async function GET(request: Request) {
  const bearer = request.headers.get("authorization") ?? "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  const ticketId = token ? verifyGuestToken(token) : null;
  if (!ticketId) {
    return NextResponse.json(
      { success: false, error: "Session expired" },
      { status: 401 },
    );
  }

  try {
    const car = await getCar(ticketId);
    return NextResponse.json({
      success: true,
      status: car?.status ?? "done",
      scheduledTime: car?.scheduledTime ?? null,
    });
  } catch (error) {
    console.error("guest/status failed:", error);
    return NextResponse.json(
      { success: false, error: "Unavailable" },
      { status: 500 },
    );
  }
}
