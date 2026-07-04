"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { MY_SHIFTS_DAYS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import type { DayShifts, ShiftAssignment } from "@/types/domain";
import { cn } from "@/utils/cn";
import { addDays, formatDateKey, localDateKey } from "@/utils/date";

interface MyShift extends ShiftAssignment {
  dateKey: string;
}

interface MyScheduleProps {
  shiftsByDate: Record<string, DayShifts>;
}

/** Valet view: today's shift + upcoming assignments for the next 14 days. */
export function MySchedule({ shiftsByDate }: MyScheduleProps) {
  const { user } = useAuth();
  const todayKey = localDateKey();

  const myShifts = useMemo(() => {
    if (!user) return [];
    const now = new Date();
    const shifts: MyShift[] = [];
    for (let i = 0; i < MY_SHIFTS_DAYS; i++) {
      const dateKey = localDateKey(addDays(now, i));
      for (const assignment of Object.values(shiftsByDate[dateKey] ?? {})) {
        if (assignment.valetUid === user.uid) {
          shifts.push({ ...assignment, dateKey });
        }
      }
    }
    return shifts;
  }, [shiftsByDate, user]);

  const todayShift = myShifts.find((s) => s.dateKey === todayKey);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="font-serif text-3xl font-light tracking-[0.05em]">
          My <span className="text-gold">Schedule</span>
        </h1>
        <p className="mt-1 text-xs tracking-[0.06em] text-ink-muted">
          Your upcoming shifts for the next 2 weeks
        </p>
      </header>

      {todayShift && (
        <div className="mb-5 flex items-center gap-4 rounded-card border border-gold-dim bg-gold/[0.08] px-5 py-4">
          <span className="text-4xl" aria-hidden="true">
            ⏰
          </span>
          <div>
            <div className="text-label mb-1">Today&apos;s Shift</div>
            <div className="text-xl font-medium text-gold">
              {todayShift.shiftName}
            </div>
            <div className="mt-0.5 text-[13px] text-ink-muted">
              {todayShift.start} – {todayShift.end}
            </div>
          </div>
          <div className="ml-auto">
            <Badge tone="success">On Duty</Badge>
          </div>
        </div>
      )}

      {myShifts.length === 0 ? (
        <div className="rounded-card border border-dashed border-edge py-10 text-center text-[13px] text-ink-dim">
          No shifts scheduled for the next 2 weeks
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {myShifts.map((shift) => {
            const isToday = shift.dateKey === todayKey;
            const [, , dayNum] = shift.dateKey.split("-");
            return (
              <div
                key={`${shift.dateKey}-${shift.shiftName}`}
                className={cn(
                  "flex items-center gap-4 rounded-card border bg-surface-1 px-5 py-4",
                  isToday ? "border-gold-dim bg-gold/[0.04]" : "border-edge",
                )}
              >
                <div className="min-w-[54px] rounded-lg bg-surface-2 px-2.5 py-2 text-center">
                  <div className="font-serif text-2xl font-light leading-none text-gold">
                    {Number(dayNum)}
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-ink-muted">
                    {formatDateKey(shift.dateKey, { month: "short" })}
                  </div>
                  <div className="mt-0.5 text-[8px] uppercase tracking-[0.1em] text-ink-dim">
                    {formatDateKey(shift.dateKey, { weekday: "short" })}
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    className="text-sm font-medium"
                    style={{ color: shift.color || undefined }}
                  >
                    {shift.shiftName}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {shift.start} – {shift.end}
                  </div>
                </div>
                {isToday && <Badge tone="gold">Today</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
