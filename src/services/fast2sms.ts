import "server-only";

/**
 * Shared Fast2SMS sender (route "q", legacy provider settings).
 * Key comes from FAST2SMS_API_KEY — never the repo.
 */
const FAST2SMS_TIMEOUT_MS = 8000;

export interface SmsResult {
  success: boolean;
  error?: string;
}

export async function sendFast2Sms(
  phone: string,
  message: string,
): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    return { success: false, error: "SMS service not configured on server" };
  }

  const cleanPhone = phone.replace(/\D/g, "").replace(/^91/, "").slice(-10);
  if (cleanPhone.length !== 10) {
    return { success: false, error: "Invalid phone" };
  }

  const url =
    "https://www.fast2sms.com/dev/bulkV2" +
    `?authorization=${apiKey}` +
    `&route=q&message=${encodeURIComponent(message)}` +
    `&language=english&flash=0&numbers=${cleanPhone}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FAST2SMS_TIMEOUT_MS),
      headers: { "cache-control": "no-cache" },
    });
    const data = (await res.json()) as { return?: boolean; message?: unknown };
    if (data.return === true) return { success: true };
    return {
      success: false,
      error: String(data.message ?? "SMS provider rejected the request"),
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      success: false,
      error: timedOut ? "Timeout reaching Fast2SMS" : "Network error reaching Fast2SMS",
    };
  }
}
