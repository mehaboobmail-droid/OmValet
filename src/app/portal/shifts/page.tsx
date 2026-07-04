"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AssignShiftModal } from "@/components/shifts/AssignShiftModal";
import { MySchedule } from "@/components/shifts/MySchedule";
import { ShiftCalendar } from "@/components/shifts/ShiftCalendar";
import { ShiftTypeManager } from "@/components/shifts/ShiftTypeManager";
import { Skeleton } from "@/components/ui/Skeleton";
import { MY_SHIFTS_DAYS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useShiftMonths } from "@/hooks/useShifts";
import { useShiftTypes } from "@/hooks/useShiftTypes";
import { useStaff } from "@/hooks/useStaff";
import { toast } from "@/hooks/useToast";
import { addDays, localDateKey, localMonthKey } from "@/utils/date";

export default function ShiftsPage() {
  const { role } = useAuth();
  return (
    <div className="px-4 py-7 sm:px-7">
      {role === "admin" ? <AdminShiftsView /> : <ValetShiftsView />}
    </div>
  );
}

// ── Valet: My Schedule ─────────────────────────────────────────────

function ValetShiftsView() {
  // Hotel-local month keys covering the 14-day horizon.
  const [months, setMonths] = useState<string[]>([]);
  useEffect(() => {
    const compute = () =>
      setMonths([
        ...new Set([
          localMonthKey(),
          localMonthKey(addDays(new Date(), MY_SHIFTS_DAYS)),
        ]),
      ]);
    compute();
  }, []);

  const { byDate, loading } = useShiftMonths(months);

  if (months.length === 0 || loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return <MySchedule shiftsByDate={byDate} />;
}

// ── Admin: Scheduler ───────────────────────────────────────────────

function AdminShiftsView() {
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    const init = () => {
      const now = new Date();
      setView({ year: now.getFullYear(), month: now.getMonth() });
    };
    init();
  }, []);

  const { shiftTypes, loading: typesLoading } = useShiftTypes();
  const { staff } = useStaff();

  const monthKeys = useMemo(() => {
    if (!view) return [];
    const viewedKey = `${view.year}-${String(view.month + 1).padStart(2, "0")}`;
    return [...new Set([viewedKey, localMonthKey(addDays(new Date(), 1))])];
  }, [view]);

  const { byDate, loading: shiftsLoading } = useShiftMonths(monthKeys);

  // One-time "tomorrow unfilled" warning (legacy admin alert).
  useEffect(() => {
    if (warnedRef.current || typesLoading || shiftsLoading || !view) return;
    const typeIds = Object.keys(shiftTypes);
    if (typeIds.length === 0) return;
    warnedRef.current = true;

    const tomorrowKey = localDateKey(addDays(new Date(), 1));
    const assigned = byDate[tomorrowKey] ?? {};
    const unfilled = typeIds.filter((id) => !assigned[id]);
    if (unfilled.length > 0) {
      const names = unfilled.map((id) => shiftTypes[id]?.name).join(", ");
      toast.warning("Tomorrow Unfilled", `${names} — no valet assigned`);
    }
  }, [typesLoading, shiftsLoading, shiftTypes, byDate, view]);

  function navigate(direction: -1 | 1) {
    setView((v) => {
      if (!v) return v;
      const next = v.month + direction;
      if (next > 11) return { year: v.year + 1, month: 0 };
      if (next < 0) return { year: v.year - 1, month: 11 };
      return { ...v, month: next };
    });
  }

  if (!view || typesLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-light tracking-[0.05em]">
          Shift <span className="text-gold">Scheduler</span>
        </h1>
        <p className="mt-1 text-xs tracking-[0.06em] text-ink-muted">
          Manage shift types · Assign valets · Calendar view
        </p>
      </header>

      <ShiftTypeManager shiftTypes={shiftTypes} />

      <ShiftCalendar
        year={view.year}
        month={view.month}
        shiftTypes={shiftTypes}
        shiftsByDate={byDate}
        onNavigate={navigate}
        onSelectDay={setSelectedDay}
      />

      <AssignShiftModal
        dateKey={selectedDay}
        shiftTypes={shiftTypes}
        dayShifts={selectedDay ? (byDate[selectedDay] ?? {}) : {}}
        staff={staff}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
