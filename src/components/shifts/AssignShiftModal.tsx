"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ShiftTypesMap } from "@/hooks/useShiftTypes";
import type { StaffMap } from "@/hooks/useStaff";
import { toast } from "@/hooks/useToast";
import { assignShift, sendShiftSms, unassignShift } from "@/services/shifts";
import type { DayShifts } from "@/types/domain";
import { formatDateKey } from "@/utils/date";

interface AssignShiftModalProps {
  dateKey: string | null;
  shiftTypes: ShiftTypesMap;
  dayShifts: DayShifts;
  staff: StaffMap;
  onClose: () => void;
}

/** Per-day assignment: one valet dropdown per shift type (legacy modal). */
export function AssignShiftModal({
  dateKey,
  shiftTypes,
  dayShifts,
  staff,
  onClose,
}: AssignShiftModalProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const typeIds = Object.keys(shiftTypes);

  async function handleSave(shiftTypeId: string) {
    if (!dateKey) return;
    const st = shiftTypes[shiftTypeId];
    const previous = dayShifts[shiftTypeId];
    const selectedUid =
      selections[shiftTypeId] ?? previous?.valetUid ?? "";

    setPendingId(shiftTypeId);
    try {
      if (!selectedUid) {
        await unassignShift(dateKey, shiftTypeId);
        toast.success("Unassigned", `${st.name} on ${dateKey} cleared`);
        return;
      }

      const valetName = staff[selectedUid]?.name ?? "—";
      await assignShift(dateKey, st, { uid: selectedUid, name: valetName });
      toast.success("Shift Assigned", `${valetName} → ${st.name} on ${dateKey}`);

      // SMS only on a new/changed assignee (legacy rule).
      if (previous?.valetUid !== selectedUid) {
        const phone = staff[selectedUid]?.phone;
        if (!phone) {
          toast.warning("Shift Saved", "No phone on file — SMS not sent");
        } else {
          const sent = await sendShiftSms({
            phone,
            valetName,
            shiftName: st.name,
            dateKey,
            start: st.start,
            end: st.end,
          });
          if (sent) toast.gold("SMS Sent", `${valetName} notified`, "📱");
          else toast.warning("SMS Failed", "Assignment saved — SMS not delivered");
        }
      }
    } catch (error) {
      toast.error("Save Failed", error instanceof Error ? error.message : "");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Modal
      open={dateKey !== null}
      onClose={() => {
        setSelections({});
        onClose();
      }}
      title="Assign Shifts"
      maxWidth="max-w-lg"
    >
      <div className="p-5">
        <div className="mb-4 text-[13px] font-medium text-gold">
          {dateKey ? formatDateKey(dateKey) : ""}
        </div>

        {typeIds.length === 0 ? (
          <p className="py-5 text-center text-xs text-ink-dim">
            No shift types created yet. Add them first.
          </p>
        ) : (
          <div className="flex flex-col">
            {typeIds.map((typeId) => {
              const st = shiftTypes[typeId];
              const current =
                selections[typeId] ?? dayShifts[typeId]?.valetUid ?? "";
              return (
                <div
                  key={typeId}
                  className="grid grid-cols-1 items-center gap-2.5 border-b border-edge py-3 last:border-b-0 sm:grid-cols-[120px_1fr_auto]"
                >
                  <div>
                    <div className="text-xs font-medium" style={{ color: st.color }}>
                      {st.name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted">
                      {st.start} – {st.end}
                    </div>
                  </div>
                  <select
                    aria-label={`Valet for ${st.name}`}
                    value={current}
                    onChange={(e) =>
                      setSelections((s) => ({ ...s, [typeId]: e.target.value }))
                    }
                    className="w-full cursor-pointer rounded-md border border-edge bg-surface-2 px-2.5 py-2 font-mono text-xs text-ink outline-none focus:border-gold-dim"
                  >
                    <option value="">— Unassigned —</option>
                    {Object.entries(staff).map(([uid, profile]) => (
                      <option key={uid} value={uid}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    loading={pendingId === typeId}
                    onClick={() => handleSave(typeId)}
                  >
                    Save
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
