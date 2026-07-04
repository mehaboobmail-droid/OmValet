"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { verifyGuestOtp, type GuestSession } from "@/services/guest/client";
import { OTP_LENGTH } from "@/constants";
import { OtpInput } from "./OtpInput";

interface OtpScreenProps {
  ticketId: string | null;
  onVerified: (session: GuestSession) => void;
}

export function OtpScreen({ ticketId, onVerified }: OtpScreenProps) {
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [shakeSignal, setShakeSignal] = useState(0);

  async function verify(code: string) {
    if (pending) return;
    if (code.length < OTP_LENGTH) {
      setError("Please enter all 4 digits.");
      return;
    }
    setPending(true);
    setError("");

    const result = await verifyGuestOtp(code, ticketId ?? undefined);
    if (result.ok) {
      onVerified(result.session);
      return;
    }
    setError(result.error);
    setShakeSignal((n) => n + 1);
    setOtp("");
    setPending(false);
  }

  return (
    <div>
      <div className="mb-6 pt-1 text-center">
        <h1 className="mb-2 font-serif text-[28px] font-light leading-tight tracking-[0.05em]">
          Verify Identity
        </h1>
        <p className="text-[13px] leading-relaxed tracking-[0.03em] text-ink-muted">
          Enter the 4-digit OTP
          <br />
          sent to your mobile number
        </p>
      </div>

      {ticketId && (
        <div className="mb-6 flex items-center gap-3.5 rounded-2xl border border-gold-dim bg-surface-1 px-4 py-4">
          <div className="flex size-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-xl">
            🎫
          </div>
          <div>
            <div className="text-label mb-1">Your Ticket</div>
            <div className="text-[17px] font-medium tracking-[0.1em] text-gold">
              {ticketId}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <span className="text-label mb-4 block text-center">
          Enter 4-Digit OTP
        </span>
        <OtpInput
          shakeSignal={shakeSignal}
          disabled={pending}
          onChange={setOtp}
          onComplete={verify}
        />
        <p className="mt-3.5 text-center text-xs leading-relaxed text-ink-dim">
          OTP was sent via SMS when your car was checked in
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden rounded-xl border border-danger/25 bg-danger/10 px-4 py-3.5 text-center text-[13px] leading-normal text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button size="lg" fullWidth loading={pending} onClick={() => verify(otp)}>
        {pending ? "Verifying…" : "Verify & Continue →"}
      </Button>
    </div>
  );
}
