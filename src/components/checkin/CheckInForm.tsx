"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useNextTicket } from "@/hooks/useTicketCounter";
import { toast } from "@/hooks/useToast";
import { checkInVehicle } from "@/services/checkIn";
import { sendCheckInSms } from "@/services/sms";
import type { Car } from "@/types/domain";
import { checkInSchema } from "@/types/schemas";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/date";
import type { CarsMap } from "@/hooks/useCars";
import { SlotGrid } from "./SlotGrid";
import { TicketModal } from "./TicketModal";

type SmsBanner =
  | { tone: "info" | "success" | "danger"; icon: string; text: string }
  | null;

interface CheckInFormProps {
  cars: CarsMap;
  slots: string[];
}

const EMPTY_FORM = {
  guest: "",
  room: "",
  plate: "",
  phone: "",
  make: "",
  model: "",
  color: "",
  notes: "",
};

export function CheckInForm({ cars, slots }: CheckInFormProps) {
  const { user, displayName } = useAuth();
  const nextTicket = useNextTicket();

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<false | "saving" | "sms">(false);
  const [banner, setBanner] = useState<SmsBanner>(null);
  const [ticket, setTicket] = useState<{ car: Car; smsSent: boolean } | null>(null);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () => setClock(formatDateTime());
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, []);

  const occupied = useMemo(
    () => new Set(Object.values(cars).map((c) => c.slot)),
    [cars],
  );

  // If another valet takes the selected slot mid-form, it deselects (derived,
  // so the UI can never submit a now-occupied slot).
  const activeSlot =
    selectedSlot && !occupied.has(selectedSlot) ? selectedSlot : null;

  function setField(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function clearForm() {
    setForm(EMPTY_FORM);
    setSelectedSlot(null);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const parsed = checkInSchema.safeParse({ ...form, slot: activeSlot ?? "" });
    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors;
      const map: Record<string, string> = {};
      for (const [key, messages] of Object.entries(fieldErrors)) {
        if (messages?.[0]) map[key] = messages[0];
      }
      setErrors(map);
      if (map.slot) toast.warning("Missing Info", map.slot);
      return;
    }
    setErrors({});

    setPending("saving");
    setBanner({ tone: "info", icon: "📱", text: "Saving and sending SMS…" });
    try {
      const car = await checkInVehicle(
        parsed.data,
        { uid: user.uid, name: displayName },
        occupied,
      );

      setPending("sms");
      const smsOk = await sendCheckInSms(car);

      clearForm();
      if (smsOk) {
        setBanner({ tone: "success", icon: "✓", text: `SMS sent to ${car.phone}` });
        toast.success("Checked In + SMS Sent", `${car.plate} → Slot ${car.slot}`);
        setTimeout(() => setBanner(null), 4000);
      } else {
        setBanner({
          tone: "danger",
          icon: "⚠",
          text: "SMS failed — show or print the ticket manually",
        });
        toast.warning("Checked In", "SMS failed — print ticket");
      }
      setTicket({ car, smsSent: smsOk });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check-in failed";
      setBanner({ tone: "danger", icon: "✕", text: message });
      toast.error("Check-In Failed", message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-light tracking-[0.08em] text-gold-light before:h-px before:w-4 before:bg-gold">
          New Vehicle Check-In
        </h2>

        {/* Ticket preview strip */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-gold-dim bg-gradient-to-br from-surface-2 to-surface-3 px-4 py-2.5">
          <div>
            <div className="text-label">Next Ticket</div>
            <div className="text-lg font-medium tracking-[0.1em] text-gold">
              #{nextTicket}
            </div>
          </div>
          <div className="text-right">
            <div className="text-label">Date &amp; Time</div>
            <div className="text-xs text-ink-muted">{clock || "—"}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Guest Name"
              required
              placeholder="Full name"
              value={form.guest}
              onChange={setField("guest")}
              error={errors.guest}
              disabled={!!pending}
            />
            <Input
              label="Room Number"
              required
              placeholder="e.g. 412"
              value={form.room}
              onChange={setField("room")}
              error={errors.room}
              disabled={!!pending}
            />
            <Input
              label="License Plate"
              required
              placeholder="MH12AB1234"
              className="uppercase"
              value={form.plate}
              onChange={setField("plate")}
              error={errors.plate}
              disabled={!!pending}
            />
            <Input
              label="Mobile Number"
              required
              type="tel"
              maxLength={12}
              placeholder="91XXXXXXXXXX"
              value={form.phone}
              onChange={setField("phone")}
              error={errors.phone}
              disabled={!!pending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input
              label="Make"
              placeholder="BMW"
              value={form.make}
              onChange={setField("make")}
              disabled={!!pending}
            />
            <Input
              label="Model"
              placeholder="X5"
              value={form.model}
              onChange={setField("model")}
              disabled={!!pending}
            />
            <Input
              label="Color"
              placeholder="Black"
              value={form.color}
              onChange={setField("color")}
              disabled={!!pending}
            />
          </div>

          <div>
            <div className={cn("text-label mb-2", errors.slot && "text-danger")}>
              Select Parking Slot <span className="text-gold">*</span>
            </div>
            <SlotGrid
              slots={slots}
              occupied={occupied}
              selected={activeSlot}
              onSelect={setSelectedSlot}
            />
          </div>

          <Textarea
            label="Notes (optional)"
            placeholder="Damages, key location…"
            value={form.notes}
            onChange={setField("notes")}
            disabled={!!pending}
          />

          {banner && (
            <div
              role="status"
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs",
                banner.tone === "info" && "border-info/30 bg-info/10 text-info",
                banner.tone === "success" &&
                  "border-success/30 bg-success/10 text-success",
                banner.tone === "danger" &&
                  "border-danger/30 bg-danger/10 text-danger",
              )}
            >
              <span>{banner.icon}</span>
              <span>{banner.text}</span>
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={!!pending}
            >
              Clear
            </Button>
            <Button type="submit" loading={!!pending}>
              {pending === "saving"
                ? "Saving…"
                : pending === "sms"
                  ? "Sending SMS…"
                  : "Check In & Send SMS →"}
            </Button>
          </div>
        </form>
      </Card>

      <TicketModal
        car={ticket?.car ?? null}
        smsSent={ticket?.smsSent ?? false}
        onClose={() => setTicket(null)}
      />
    </>
  );
}
