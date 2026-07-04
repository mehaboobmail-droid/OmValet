import { clientAuth } from "@/firebase/client";
import type { Car } from "@/types/domain";

/**
 * Ask the server to send the check-in SMS (ticket + OTP + guest link).
 * The endpoint requires a staff ID token — SMS spends money and must not be
 * publicly callable (the legacy function was unauthenticated).
 *
 * Returns true on delivery success; false on any failure (legacy contract —
 * check-in itself never fails because of SMS).
 */
export async function sendCheckInSms(car: Car): Promise<boolean> {
  try {
    const token = await clientAuth().currentUser?.getIdToken();
    if (!token) return false;

    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        phone: car.phone,
        ticketId: car.id,
        otp: car.otp,
      }),
    });

    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!data.success) {
      console.error("SMS failed:", data.error);
    }
    return data.success === true;
  } catch {
    return false;
  }
}

/** The link guests receive — also printed on the ticket slip. */
export function guestLink(ticketId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/guest?ticket=${ticketId}`;
}
