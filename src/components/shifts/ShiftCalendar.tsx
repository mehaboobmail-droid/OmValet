"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ShiftTypesMap } from "@/hooks/useShiftTypes";
import type { DayShifts } from "@/types/domain";
import { cn } from "@/utils/cn";
import { localDateKey } from "@/utils/date";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ShiftCalendarProps {
  year: number;
  /** 0-based month. */
  month: number;
  shiftTypes: ShiftTypesMap;
  shiftsByDate: Record<string, DayShifts>;
  onNavigate: (direction: -1 | 1) => void;
  onSelectDay: (dateKey: string) => void;
}

/** Staffing heatmap calendar (legacy colour rules, dynamic month loading). */
export function ShiftCalendar({
  year,
  month,
  shiftTypes,
  shiftsByDate,
  onNavigate,
  onSelectDay,
}: ShiftCalendarProps) {
  const today = localDateKey();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const typeIds = Object.keys(shiftTypes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {MONTHS[month]} {year}
        </CardTitle>
        <div className="flex gap-2">
          <NavButton label="Previous month" onClick={() => onNavigate(-1)}>
            ‹
          </NavButton>
          <NavButton label="Next month" onClick={() => onNavigate(1)}>
            ›
          </NavButton>
        </div>
      </CardHeader>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 border-b border-edge px-4 py-3">
        <LegendItem swatch="bg-success/40" label="Fully Staffed" />
        <LegendItem swatch="bg-warning/40" label="Partially Filled" />
        <LegendItem swatch="bg-danger/20" label="Unfilled" />
        <LegendItem swatch="border border-edge bg-surface-3" label="No Shifts Needed" />
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-edge bg-surface-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[9px] uppercase tracking-[0.15em] text-ink-dim"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`lead-${i}`} className="min-h-14 border border-edge/50 opacity-35 sm:min-h-[90px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayShifts = shiftsByDate[dateKey] ?? {};
          const assigned = Object.keys(dayShifts).length;
          const isPast = dateKey < today;
          const isToday = dateKey === today;

          const heat =
            typeIds.length === 0
              ? ""
              : assigned === 0
                ? "bg-danger/[0.08]"
                : assigned < typeIds.length
                  ? "bg-warning/[0.08]"
                  : "bg-success/[0.06]";

          return (
            <button
              key={dateKey}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDay(dateKey)}
              aria-label={`Assign shifts on ${dateKey}`}
              className={cn(
                "min-h-14 border border-edge/50 p-1 text-left align-top transition-colors sm:min-h-[90px] sm:p-1.5",
                heat,
                isToday && "border-gold-dim bg-gold/5",
                isPast
                  ? "cursor-default opacity-50"
                  : "cursor-pointer hover:bg-surface-2",
              )}
            >
              <div
                className={cn(
                  "mb-1 text-[11px] font-medium",
                  isToday ? "text-gold" : "text-ink-muted",
                )}
              >
                {day}
              </div>
              <div className="hidden sm:block">
                {typeIds.map((typeId) => {
                  const st = shiftTypes[typeId];
                  const filled = dayShifts[typeId];
                  return (
                    <div
                      key={typeId}
                      title={`${st.name}: ${filled ? filled.valetName : "Unassigned"}`}
                      className="mb-0.5 truncate rounded-sm px-1 py-0.5 text-[8px] tracking-[0.04em]"
                      style={{
                        color: st.color,
                        backgroundColor: `${st.color}${filled ? "33" : "15"}`,
                        border: `1px solid ${st.color}${filled ? "55" : "22"}`,
                      }}
                    >
                      {st.name.slice(0, 6)}
                      {filled ? `: ${filled.valetName.split(" ")[0]}` : " ?"}
                    </div>
                  );
                })}
              </div>
              {/* Mobile: assignment count dot instead of chips */}
              {typeIds.length > 0 && (
                <div className="text-center text-[9px] text-ink-dim sm:hidden">
                  {assigned}/{typeIds.length}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-edge bg-surface-2 text-sm text-ink transition-colors hover:border-gold-dim hover:text-gold"
    >
      {children}
    </button>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
      <span className={cn("size-3 rounded-sm", swatch)} />
      {label}
    </span>
  );
}
