"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/hooks/useToast";
import { sendCheckInSms } from "@/services/sms";
import type { Car } from "@/types/domain";
import { TicketSlip } from "./TicketSlip";

type SmsState = "sent" | "not-sent" | "sending";

interface TicketModalProps {
  car: Car | null;
  smsSent: boolean;
  onClose: () => void;
}

/** Post-check-in ticket: printable slip, SMS status, resend. */
export function TicketModal({ car, smsSent, onClose }: TicketModalProps) {
  const [smsState, setSmsState] = useState<SmsState | null>(null);
  const effective: SmsState = smsState ?? (smsSent ? "sent" : "not-sent");

  async function handleResend() {
    if (!car) return;
    setSmsState("sending");
    const ok = await sendCheckInSms(car);
    setSmsState(ok ? "sent" : "not-sent");
    if (ok) toast.success("SMS Resent", `Sent to ${car.phone}`);
    else toast.warning("Resend Failed", "Check SMS service");
  }

  return (
    <Modal open={car !== null} onClose={onClose} title="Valet Ticket">
      {car && (
        <>
          <div className="p-4">
            <TicketSlip car={car} />
          </div>
          <div className="flex items-center justify-between px-5 pb-2 text-[11px] text-ink-muted">
            <span>
              {effective === "sending"
                ? "Sending…"
                : effective === "sent"
                  ? "SMS sent to guest ✓"
                  : "SMS not sent — show ticket manually"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              loading={effective === "sending"}
            >
              Resend SMS
            </Button>
          </div>
          <div className="flex gap-2 px-5 pb-5 pt-2">
            <Button className="flex-1" onClick={() => window.print()}>
              🖨 Print
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
