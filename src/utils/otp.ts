import { OTP_LENGTH } from "@/constants";

/**
 * Cryptographically random numeric OTP (no leading zero, matching the
 * legacy 1000–9999 range for 4 digits). Works in browser and Node runtimes.
 */
export function generateOtp(length: number = OTP_LENGTH): string {
  const min = 10 ** (length - 1);
  const span = 9 * min;
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return String(min + (buffer[0] % span));
}
