import type { CarStatus, GuestCar } from "@/types/domain";

/** Browser-side wrappers for the guest API routes. */

export interface GuestSession {
  car: GuestCar;
  token: string;
}

export type VerifyResult =
  | { ok: true; session: GuestSession }
  | { ok: false; error: string };

export async function verifyGuestOtp(
  otp: string,
  ticketId?: string,
): Promise<VerifyResult> {
  try {
    const res = await fetch("/api/guest/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp, ...(ticketId ? { ticketId } : {}) }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      car?: GuestCar;
      token?: string;
      error?: string;
    };
    if (data.success && data.car && data.token) {
      return { ok: true, session: { car: data.car, token: data.token } };
    }
    return {
      ok: false,
      error: data.error ?? "Something went wrong. Please try again.",
    };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function requestGuestRetrieval(
  token: string,
  status: "requesting" | "scheduled",
  scheduledTime: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/guest/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, status, scheduledTime }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    return data.success
      ? { ok: true }
      : { ok: false, error: data.error ?? "Could not confirm" };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}

export async function fetchGuestStatus(
  token: string,
): Promise<CarStatus | "done" | null> {
  try {
    const res = await fetch("/api/guest/status", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await res.json()) as { success?: boolean; status?: string };
    return data.success ? ((data.status as CarStatus | "done") ?? null) : null;
  } catch {
    return null;
  }
}
