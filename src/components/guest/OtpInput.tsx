"use client";

import { useEffect, useRef, useState } from "react";
import { OTP_LENGTH } from "@/constants";
import { cn } from "@/utils/cn";

interface OtpInputProps {
  /** Bumped by the parent to clear the boxes and shake (wrong OTP). */
  shakeSignal?: number;
  disabled?: boolean;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
}

/**
 * 4-box OTP entry: auto-advance, backspace to previous, paste / SMS-autofill
 * distribution, auto-submit on last digit (legacy behaviour preserved).
 */
export function OtpInput({ shakeSignal = 0, disabled, onComplete, onChange }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [shaking, setShaking] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const lastShake = useRef(shakeSignal);

  // Parent signalled a wrong OTP → clear, shake, refocus first box.
  useEffect(() => {
    if (shakeSignal === lastShake.current) return;
    lastShake.current = shakeSignal;
    setDigits(Array(OTP_LENGTH).fill(""));
    setShaking(true);
    refs.current[0]?.focus();
    const timer = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(timer);
  }, [shakeSignal]);

  function commit(next: string[]) {
    setDigits(next);
    const joined = next.join("");
    onChange?.(joined);
    if (joined.length === OTP_LENGTH && next.every(Boolean)) {
      // Small delay so the last digit paints before submit (legacy feel).
      setTimeout(() => onComplete(joined), 200);
    }
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    commit(next);
    if (value && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => text[i] ?? "");
    commit(next);
    refs.current[Math.min(text.length, OTP_LENGTH) - 1]?.focus();
  }

  return (
    <div
      className={cn("flex justify-center gap-3", shaking && "animate-otp-shake")}
      onPaste={handlePaste}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`OTP digit ${i + 1}`}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            "size-16 rounded-2xl border-2 border-edge bg-surface-2 text-center font-mono text-xl font-medium text-gold caret-gold outline-none transition-all duration-200 sm:size-[68px]",
            "focus:border-gold focus:bg-surface-3 focus:shadow-[0_0_0_3px_rgb(201_168_76/0.15)]",
            "disabled:opacity-50",
          )}
        />
      ))}
    </div>
  );
}
