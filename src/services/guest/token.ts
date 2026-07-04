import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Compact HMAC-signed guest session token, minted after successful OTP
 * verification. Binds subsequent status reads/updates to one ticket so the
 * guest endpoints cannot be driven by anyone who merely knows a ticket ID
 * (the legacy update-status function was completely open).
 *
 * Format: base64url("{ticketId}.{expiresAtMs}") + "." + hmacSha256Signature
 */
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // one retrieval session

function secret(): string {
  const value = process.env.GUEST_TOKEN_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "GUEST_TOKEN_SECRET must be set (>= 32 chars) for the guest flow",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function mintGuestToken(ticketId: string, now = Date.now()): string {
  const payload = `${ticketId}.${now + TOKEN_TTL_MS}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

/** Returns the ticketId for a valid, unexpired token; null otherwise. */
export function verifyGuestToken(token: string, now = Date.now()): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = Buffer.from(token.slice(0, dot), "base64url").toString();
  const givenSig = Buffer.from(token.slice(dot + 1));
  const expectedSig = Buffer.from(sign(payload));
  if (
    givenSig.length !== expectedSig.length ||
    !timingSafeEqual(givenSig, expectedSig)
  ) {
    return null;
  }

  const sep = payload.lastIndexOf(".");
  if (sep <= 0) return null;
  const ticketId = payload.slice(0, sep);
  const expiresAt = Number(payload.slice(sep + 1));
  if (!Number.isFinite(expiresAt) || expiresAt < now) return null;

  return ticketId;
}
