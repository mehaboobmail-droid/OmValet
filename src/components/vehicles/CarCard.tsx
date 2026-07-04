"use client";

import { motion } from "framer-motion";
import type { Car } from "@/types/domain";
import { cn } from "@/utils/cn";
import { StatusBadge } from "./StatusBadge";

interface CarCardProps {
  car: Car;
  busy: boolean;
  onPrint: (car: Car) => void;
  onReady: (car: Car) => void;
  onCheckout: (car: Car) => void;
}

/** One active vehicle row: ticket · details · slot · status + actions. */
export function CarCard({ car, busy, onPrint, onReady, onCheckout }: CarCardProps) {
  const ticketNo = car.id.split("-")[1] ?? car.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border bg-surface-1 px-4 py-3",
        car.status === "requesting" && "border-warning/40 bg-warning/[0.02]",
        car.status === "ready" && "border-success/40 bg-success/[0.02]",
        car.status !== "requesting" && car.status !== "ready" && "border-edge",
      )}
    >
      <div className="min-w-[44px] text-lg font-medium text-gold">{ticketNo}</div>

      <div className="min-w-0 flex-1 basis-40">
        <div className="text-[13px] font-medium tracking-[0.08em]">{car.plate}</div>
        <div className="truncate text-[11px] text-ink-muted">
          {car.make} {car.model} · {car.color} · {car.guest} (Rm {car.room}) ·{" "}
          {car.time}
        </div>
        <div className="mt-0.5 text-[10px] text-ink-dim">
          👤 {car.valetName || "—"}
          {car.status === "scheduled" && car.scheduledTime && (
            <span className="ml-2 text-info">🕐 {car.scheduledTime}</span>
          )}
        </div>
      </div>

      <div className="min-w-[44px] text-center">
        <div className="text-[15px] font-medium text-ink-dim">{car.slot}</div>
        <div className="text-[8px] uppercase tracking-[0.12em] text-ink-dim">
          Slot
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <StatusBadge status={car.status} />
        <IconButton title="Print ticket" onClick={() => onPrint(car)} disabled={busy}>
          🖨
        </IconButton>
        {car.status === "requesting" && (
          <IconButton
            title="Mark ready at porch"
            onClick={() => onReady(car)}
            disabled={busy}
            accent="success"
          >
            ✓
          </IconButton>
        )}
        {car.status === "ready" && (
          <IconButton
            title="Check out & hand over"
            onClick={() => onCheckout(car)}
            disabled={busy}
            accent="success"
            filled
          >
            🚗
          </IconButton>
        )}
      </div>
    </motion.div>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  accent,
  filled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: "success";
  filled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-md border text-[13px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        accent === "success"
          ? "border-success/50 text-success hover:bg-success/15"
          : "border-edge bg-surface-2 text-ink-muted hover:border-gold-dim hover:text-gold",
        filled && "bg-success/10",
      )}
    >
      {children}
    </button>
  );
}
