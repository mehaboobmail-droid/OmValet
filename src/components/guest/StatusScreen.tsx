"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { IMMEDIATE_ETA_LABEL } from "@/constants";
import { toast } from "@/hooks/useToast";
import { fetchGuestStatus, type GuestSession } from "@/services/guest/client";
import { formatTime } from "@/utils/date";
import { cn } from "@/utils/cn";

const POLL_INTERVAL_MS = 5000;

interface StatusScreenProps {
  session: GuestSession;
  mode: "immediate" | "scheduled";
  scheduledTime: string | null;
  /** Display time the request was confirmed (set by the confirm handler). */
  requestedAt: string;
  onBack: () => void;
}

/** Live retrieval tracker: progress bar, ETA, 4-step timeline, ready moment. */
export function StatusScreen({
  session,
  mode,
  scheduledTime,
  requestedAt,
  onBack,
}: StatusScreenProps) {
  const [ready, setReady] = useState(false);
  const [readyAt, setReadyAt] = useState("");
  const celebrated = useRef(false);

  // Poll until the car is ready (server-verified — no public DB access).
  useEffect(() => {
    if (ready) return;
    let cancelled = false;

    async function poll() {
      const status = await fetchGuestStatus(session.token);
      if (cancelled) return;
      if (status === "ready") {
        setReady(true);
        setReadyAt(formatTime());
        if (!celebrated.current) {
          celebrated.current = true;
          toast.gold("Your car is waiting!", "Please proceed to the porch", "🎉");
        }
      }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session.token, ready]);

  const steps = [
    { label: "Request Received", time: requestedAt, state: "done" as const },
    {
      label: "Valet Dispatched",
      time: ready ? readyAt : "Now",
      state: ready ? ("done" as const) : ("current" as const),
    },
    {
      label: "Vehicle Retrieved",
      time: ready ? readyAt : "—",
      state: ready ? ("done" as const) : ("pending" as const),
    },
    {
      label: "Ready at Porch",
      time: ready ? readyAt : "—",
      state: ready ? ("done" as const) : ("pending" as const),
    },
  ];

  return (
    <div>
      <div className="mb-6 text-center">
        <motion.div
          animate={
            ready
              ? { scale: [1, 1.15, 1] }
              : {
                  boxShadow: [
                    "0 0 0 0 rgb(232 164 58 / 0.3)",
                    "0 0 0 16px rgb(232 164 58 / 0)",
                  ],
                }
          }
          transition={
            ready
              ? { duration: 0.6, ease: "easeOut" }
              : { duration: 2, repeat: Infinity }
          }
          className={cn(
            "mx-auto mb-5 flex size-[100px] items-center justify-center rounded-full border-2 text-[42px]",
            ready
              ? "border-success/40 bg-success/10"
              : "border-warning/30 bg-warning/10",
          )}
        >
          {ready ? "✅" : "🚘"}
        </motion.div>
        <h2 className="mb-1.5 font-serif text-[26px] font-light tracking-[0.05em]">
          {ready ? "Your Car is Ready!" : "Retrieving Your Car"}
        </h2>
        <p className="text-[13px] leading-relaxed text-ink-muted">
          {ready
            ? "Please proceed to the main porch"
            : mode === "scheduled"
              ? "Your pickup is scheduled — we'll have it ready"
              : "Our valet is heading to your parking slot"}
        </p>
      </div>

      <div className="mb-5 h-1 overflow-hidden rounded bg-surface-2">
        <motion.div
          className="h-full rounded bg-gradient-to-r from-gold-dim to-gold"
          initial={{ width: "20%" }}
          animate={{ width: ready ? "100%" : "20%" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mb-5 flex items-center justify-between rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-gold/[0.03] px-5 py-4">
        <div>
          <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-ink-muted">
            Estimated Wait
          </div>
          <div className="font-serif text-[26px] font-light text-gold">
            {ready
              ? "Ready Now"
              : mode === "scheduled"
                ? (scheduledTime ?? "—")
                : IMMEDIATE_ETA_LABEL}
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-ink-muted">
            Your Slot
          </div>
          <div className="text-[22px] font-medium">{session.car.slot}</div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-edge bg-surface-1">
        {steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              "flex items-center gap-3.5 border-b border-edge px-4.5 py-3.5 last:border-b-0",
              step.state === "done" && "bg-success/[0.03]",
              step.state === "current" && "bg-warning/[0.04]",
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[13px]",
                step.state === "done" && "bg-success/20",
                step.state === "current" && "bg-warning/20",
                step.state === "pending" && "bg-surface-2",
              )}
            >
              {step.state === "done" ? "✓" : step.state === "current" ? "⋯" : "○"}
            </span>
            <span className="flex-1 text-[13px]">{step.label}</span>
            <span className="text-[11px] text-ink-muted">{step.time}</span>
          </div>
        ))}
      </div>

      <Button variant="outline" size="lg" fullWidth onClick={onBack}>
        ← Make Another Request
      </Button>
    </div>
  );
}
