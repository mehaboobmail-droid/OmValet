import "server-only";

/**
 * Twilio SMS sender (Programmable Messaging REST API).
 * Credentials come from the environment — never the repo:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and either
 *   TWILIO_FROM_NUMBER (E.164) or TWILIO_MESSAGING_SERVICE_SID.
 */
const TWILIO_TIMEOUT_MS = 8000;
const DEFAULT_COUNTRY_CODE = "91"; // India

export interface SmsResult {
  success: boolean;
  error?: string;
}

/** Normalise a stored phone to E.164, defaulting to +91 when no country code. */
function toE164(phone: string): string | null {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return /^\+\d{8,15}$/.test(trimmed) ? trimmed : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+${DEFAULT_COUNTRY_CODE}${digits}`;
  if (digits.length === 12 && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return `+${digits}`;
  }
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!sid || !token || (!fromNumber && !messagingServiceSid)) {
    return { success: false, error: "SMS service not configured on server" };
  }

  const to = toE164(phone);
  if (!to) return { success: false, error: "Invalid phone" };

  const form = new URLSearchParams({ To: to, Body: message });
  if (messagingServiceSid) form.set("MessagingServiceSid", messagingServiceSid);
  else form.set("From", fromNumber as string);

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        signal: AbortSignal.timeout(TWILIO_TIMEOUT_MS),
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );
    const data = (await res.json()) as {
      sid?: string;
      message?: string;
      error_message?: string;
    };
    if (res.ok && data.sid) return { success: true };
    return {
      success: false,
      error: data.message || data.error_message || "SMS provider rejected the request",
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      success: false,
      error: timedOut ? "Timeout reaching Twilio" : "Network error reaching Twilio",
    };
  }
}
