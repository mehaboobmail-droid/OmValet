"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CarsMap } from "@/hooks/useCars";
import { toast } from "@/hooks/useToast";
import {
  buildReportCsv,
  loadReportRows,
  rangeDateKeys,
  type ReportRange,
  type ReportRow,
} from "@/services/reports";
import { cn } from "@/utils/cn";

const RANGE_LABELS: Record<ReportRange, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  custom: "Custom",
};

interface ReportSectionProps {
  cars: CarsMap;
}

export function ReportSection({ cars }: ReportSectionProps) {
  const [range, setRange] = useState<ReportRange>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [daysWithData, setDaysWithData] = useState(1);
  const [loading, setLoading] = useState(true);
  const [valetFilter, setValetFilter] = useState("");
  const requestSeq = useRef(0);

  const load = useCallback(
    async (
      nextRange: ReportRange,
      from: string,
      to: string,
      liveCars: CarsMap,
    ) => {
      const dateKeys = rangeDateKeys(nextRange, from, to);
      if (dateKeys.length === 0) return;
      const seq = ++requestSeq.current;
      try {
        const result = await loadReportRows(dateKeys, liveCars);
        if (seq !== requestSeq.current) return; // stale response
        setRows(result.rows);
        setDaysWithData(result.daysWithData);
      } catch (error) {
        if (seq === requestSeq.current) {
          toast.error(
            "Report Failed",
            error instanceof Error ? error.message : "Could not load data",
          );
        }
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [],
  );

  // Initial load (today) — silently refresh when live cars change so
  // "still parked" rows stay current (no skeleton flash). All setState in
  // `load` happens after awaited network I/O, never synchronously.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(range, customFrom, customTo, cars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars]);

  function selectRange(next: ReportRange) {
    setRange(next);
    if (next !== "custom") {
      setLoading(true);
      void load(next, customFrom, customTo, cars);
    }
  }

  const filteredRows = useMemo(
    () => (valetFilter ? rows.filter((r) => r.valetUid === valetFilter) : rows),
    [rows, valetFilter],
  );

  const valetOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.valetUid) map.set(row.valetUid, row.parkedBy || "—");
    }
    return [...map.entries()];
  }, [rows]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const done = filteredRows.filter((r) => r.status === "done").length;
    return {
      total,
      done,
      live: total - done,
      valets: new Set(filteredRows.map((r) => r.valetUid).filter(Boolean)).size,
      avg: (total / daysWithData).toFixed(1),
    };
  }, [filteredRows, daysWithData]);

  function exportCsv() {
    if (filteredRows.length === 0) {
      toast.warning("No Data", "Nothing to export for this range");
      return;
    }
    const blob = new Blob([buildReportCsv(filteredRows)], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `valet-report-${rangeDateKeys(range, customFrom, customTo)[0] ?? "export"}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.gold("Exported", `${filteredRows.length} records downloaded`, "⬇");
  }

  const dateInputClasses =
    "rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none focus:border-gold-dim";

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <CardTitle>Activity Log &amp; Valet Performance</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-edge bg-surface-2 p-1">
            {(Object.keys(RANGE_LABELS) as ReportRange[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => selectRange(key)}
                className={cn(
                  "cursor-pointer rounded px-3 py-1 text-[10px] uppercase tracking-[0.1em] transition-colors",
                  range === key
                    ? "bg-gold font-medium text-obsidian"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>

          {range === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                aria-label="From date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={dateInputClasses}
              />
              <span className="text-[11px] text-ink-dim">to</span>
              <input
                type="date"
                aria-label="To date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className={dateInputClasses}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (rangeDateKeys("custom", customFrom, customTo).length === 0) {
                    toast.warning("Invalid Range", "From date must be before To date");
                    return;
                  }
                  setLoading(true);
                  void load("custom", customFrom, customTo, cars);
                }}
                disabled={!customFrom || !customTo}
              >
                Load
              </Button>
            </div>
          )}

          <select
            aria-label="Filter by valet"
            value={valetFilter}
            onChange={(e) => setValetFilter(e.target.value)}
            className="cursor-pointer rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none focus:border-gold-dim"
          >
            <option value="">All Valets</option>
            {valetOptions.map(([uid, name]) => (
              <option key={uid} value={uid}>
                {name}
              </option>
            ))}
          </select>

          <Button size="sm" variant="outline" onClick={exportCsv}>
            ⬇ CSV
          </Button>
        </div>
      </CardHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-px border-b border-edge bg-edge sm:grid-cols-5">
        <SummaryCell value={summary.total} label="Total Cars" tone="text-gold" />
        <SummaryCell value={summary.done} label="Completed" tone="text-success" />
        <SummaryCell value={summary.live} label="Still Parked" tone="text-warning" />
        <SummaryCell value={summary.valets} label="Valets Active" tone="text-info" />
        <SummaryCell value={summary.avg} label="Avg/Day" tone="text-ink-muted" />
      </div>

      {/* Log table */}
      {loading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-7 text-center text-xs text-ink-dim">
          No activity for selected period
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[80px_130px_70px_80px_80px_100px_110px_70px_110px_80px_1fr] border-b border-edge bg-surface-2 text-[9px] uppercase tracking-[0.15em] text-ink-dim">
              {[
                "Time In",
                "Guest Name",
                "Suite #",
                "Make",
                "Colour",
                "Licence",
                "Parked By",
                "Spot #",
                "Retrieved By",
                "Time Out",
                "Notes",
              ].map((h) => (
                <div key={h} className="truncate px-3 py-2.5">
                  {h}
                </div>
              ))}
            </div>
            {filteredRows.map((row) => {
              const done = row.status === "done";
              return (
                <div
                  key={`${row.date}-${row.ticketId}`}
                  className="grid grid-cols-[80px_130px_70px_80px_80px_100px_110px_70px_110px_80px_1fr] border-b border-edge text-[11px] last:border-b-0 odd:bg-white/[0.01] hover:bg-white/[0.02]"
                >
                  <Cell className={done ? "text-ink-dim" : "text-warning"}>
                    {row.timeIn || "—"}
                  </Cell>
                  <Cell title={row.guest}>{row.guest || "—"}</Cell>
                  <Cell>{row.room || "—"}</Cell>
                  <Cell>{row.make || "—"}</Cell>
                  <Cell>{row.color || "—"}</Cell>
                  <Cell className="font-medium tracking-[0.06em]">
                    {row.plate || "—"}
                  </Cell>
                  <Cell className="text-gold">{row.parkedBy || "—"}</Cell>
                  <Cell className="font-medium text-gold">{row.slot || "—"}</Cell>
                  <Cell className={done ? "text-success" : "text-ink-dim"}>
                    {row.retrievedBy || "—"}
                  </Cell>
                  <Cell className={done ? "text-ink-dim" : "text-warning"}>
                    {row.timeOut || "—"}
                  </Cell>
                  <Cell title={row.notes} className="text-[10px] text-ink-muted">
                    {(row.notes || "—").slice(0, 30)}
                    {(row.notes || "").length > 30 ? "…" : ""}
                  </Cell>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function SummaryCell({
  value,
  label,
  tone,
}: {
  value: number | string;
  label: string;
  tone: string;
}) {
  return (
    <div className="bg-surface-1 px-3 py-3.5 text-center">
      <div className={cn("font-serif text-[26px] font-light leading-none", tone)}>
        {value}
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </div>
    </div>
  );
}

function Cell({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={cn("truncate px-3 py-2.5", className)}
    >
      {children}
    </div>
  );
}
