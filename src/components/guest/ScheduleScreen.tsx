"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  PICKUP_SLOT_COUNT,
  PICKUP_SLOT_INTERVAL_MINUTES,
} from "@/constants";
import { toast } from "@/hooks/useToast";
import { requestGuestRetrieval, type GuestSession } from "@/services/guest/client";
import { formatTime } from "@/utils/date";
import { cn } from "@/utils/cn";

type Mode = "immediate" | "scheduled";

interface ScheduleScreenProps {
  session: GuestSession;
  onConfirmed: (mode: Mode, scheduledTime: string | null) => void;
  onBack: () => void;
}

export function ScheduleScreen({ session, onConfirmed, onBack }: ScheduleScreenProps) {
  const { car, token } = session;
  const [mode, setMode] = useState<Mode>("immediate");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // 8 options in 20-minute increments, generated when "Later" is chosen so
  // the times are fresh at the moment of choice.
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  function chooseScheduled() {
    setMode("scheduled");
    setTimeSlots(
      Array.from({ length: PICKUP_SLOT_COUNT }, (_, i) =>
        formatTime(
          new Date(Date.now() + (i + 1) * PICKUP_SLOT_INTERVAL_MINUTES * 60_000),
        ),
      ),
    );
  }

  async function confirm() {
    if (mode === "scheduled" && !selectedTime) {
      toast.warning("Pick a Time", "Select a pickup time first");
      return;
    }
    setPending(true);
    const result = await requestGuestRetrieval(
      token,
      mode === "immediate" ? "requesting" : "scheduled",
      mode === "scheduled" ? selectedTime : null,
    );
    setPending(false);

    if (!result.ok) {
      toast.error("Failed", result.error);
      return;
    }
    onConfirmed(mode, mode === "scheduled" ? selectedTime : null);
  }

  return (
    <div>
      {/* Verified car card */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-gold-dim bg-surface-1 p-5">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold-dim via-gold to-gold-dim" />
        <span className="absolute right-4 top-4 rounded border border-success/25 bg-success/12 px-2 py-1 text-[9px] uppercase tracking-[0.15em] text-success">
          Verified ✓
        </span>
        <div className="mb-4 flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-2xl">
            🚗
          </div>
          <div>
            <div className="text-xl font-medium tracking-[0.12em]">{car.plate}</div>
            <div className="text-xs text-ink-muted">
              {car.make} {car.model} · {car.color}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <CardField label="Guest" value={car.guest} />
          <CardField label="Room" value={`Room ${car.room}`} />
          <CardField label="Parking Slot" value={car.slot} gold />
          <CardField label="Checked In" value={car.time} />
        </div>
      </div>

      <h2 className="mb-1.5 font-serif text-2xl font-light tracking-[0.06em]">
        Retrieve Your Car
      </h2>
      <p className="mb-5 text-[13px] leading-relaxed text-ink-muted">
        When would you like your vehicle brought to the porch?
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <ModeOption
          icon="⚡"
          title="Now"
          description={`Bring it immediately\n~10–15 min`}
          selected={mode === "immediate"}
          onClick={() => setMode("immediate")}
        />
        <ModeOption
          icon="🕐"
          title="Later"
          description={"Schedule a\nspecific time"}
          selected={mode === "scheduled"}
          onClick={chooseScheduled}
        />
      </div>

      {mode === "scheduled" && (
        <div className="mb-5 rounded-2xl border border-edge bg-surface-1 p-4.5">
          <span className="text-label mb-3.5 block">Select pickup time</span>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-1 text-xs transition-all duration-150 active:scale-95",
                  slot === selectedTime
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-edge bg-surface-2 text-ink-muted hover:border-gold-dim",
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button size="lg" fullWidth loading={pending} onClick={confirm} className="mb-3">
        {pending ? "Confirming…" : "Confirm Retrieval →"}
      </Button>
      <Button variant="outline" size="lg" fullWidth onClick={onBack} disabled={pending}>
        ← Change OTP
      </Button>
    </div>
  );
}

function CardField({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3.5 py-3">
      <div className="mb-1 text-[9px] uppercase tracking-[0.2em] text-ink-dim">
        {label}
      </div>
      <div className={cn("text-[13px] font-medium", gold && "text-gold")}>{value}</div>
    </div>
  );
}

function ModeOption({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 active:scale-[0.97]",
        selected ? "border-gold bg-gold/5" : "border-edge bg-surface-1",
      )}
    >
      <span className="text-[28px]">{icon}</span>
      <span
        className={cn(
          "text-sm font-medium tracking-[0.06em]",
          selected && "text-gold",
        )}
      >
        {title}
      </span>
      <span className="whitespace-pre-line text-[11px] leading-snug text-ink-muted">
        {description}
      </span>
    </button>
  );
}
