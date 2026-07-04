"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import type { CarsMap } from "@/hooks/useCars";
import { useCheckedOutCount } from "@/hooks/useCheckedOutCount";
import { toast } from "@/hooks/useToast";
import { markCarReady } from "@/services/retrieval";
import type { Car } from "@/types/domain";
import { cn } from "@/utils/cn";

/** Sidebar: today's overview stats, retrieval queue, scheduled pickups. */
export function SidePanel({ cars }: { cars: CarsMap }) {
  const { user, displayName } = useAuth();
  const checkedOut = useCheckedOutCount();

  const all = useMemo(() => Object.values(cars), [cars]);
  const queue = all.filter((c) => c.status === "requesting" || c.status === "ready");
  const scheduled = all.filter((c) => c.status === "scheduled");

  async function handleReady(car: Car) {
    if (!user) return;
    try {
      await markCarReady(car, { uid: user.uid, name: displayName });
      toast.gold("Car Ready", `${car.plate} at porch`, "🚗");
    } catch (error) {
      toast.error("Update Failed", error instanceof Error ? error.message : "");
    }
  }

  return (
    <aside className="flex flex-col gap-6">
      <PanelSection title="Today's Overview">
        <div className="grid grid-cols-2 gap-2">
          <StatCard value={all.filter((c) => c.status === "parked").length} label="Parked" />
          <StatCard value={all.filter((c) => c.status === "requesting").length} label="Requesting" />
          <StatCard value={all.filter((c) => c.status === "ready").length} label="Ready" />
          <StatCard value={checkedOut} label="Checked Out" />
        </div>
      </PanelSection>

      <PanelSection title="Retrieval Queue">
        {queue.length === 0 ? (
          <EmptyNote>No pending retrievals</EmptyNote>
        ) : (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {queue.map((car) => (
                <QueueItem
                  key={car.id}
                  car={car}
                  onReady={() => handleReady(car)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </PanelSection>

      <PanelSection title="Scheduled Later">
        {scheduled.length === 0 ? (
          <EmptyNote>No scheduled pickups</EmptyNote>
        ) : (
          <div className="flex flex-col gap-1.5">
            {scheduled.map((car) => (
              <div
                key={car.id}
                className="flex items-center justify-between rounded-lg border border-info/30 bg-surface-2 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="min-w-9 text-sm font-medium text-gold">
                    {car.id.split("-")[1]}
                  </span>
                  <div>
                    <div className="text-xs tracking-[0.07em]">{car.plate}</div>
                    <div className="text-[10px] text-ink-muted">
                      {car.scheduledTime || "—"}
                    </div>
                  </div>
                </div>
                <span className="rounded border border-info/25 bg-info/12 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-info">
                  Sched
                </span>
              </div>
            ))}
          </div>
        )}
      </PanelSection>
    </aside>
  );
}

function QueueItem({ car, onReady }: { car: Car; onReady: () => void }) {
  const isRequesting = car.status === "requesting";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className={cn(
        "flex items-center justify-between rounded-lg border bg-surface-2 px-3 py-2.5",
        isRequesting ? "border-danger/35" : "border-edge",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="min-w-9 text-sm font-medium text-gold">
          {car.id.split("-")[1]}
        </span>
        <div>
          <div className="text-xs tracking-[0.07em]">{car.plate}</div>
          <div className="text-[10px] text-ink-muted">
            Slot {car.slot} · {isRequesting ? "NOW" : "READY"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-1.5 animate-pulse rounded-full",
            isRequesting ? "bg-warning" : "bg-success",
          )}
        />
        {isRequesting && (
          <button
            type="button"
            onClick={onReady}
            className="cursor-pointer rounded border border-edge bg-surface-3 px-2 py-1 text-[10px] text-ink-muted transition-colors hover:border-success hover:text-success"
          >
            Ready
          </button>
        )}
      </div>
    </motion.div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2.5 border-b border-edge pb-1.5 text-[10px] uppercase tracking-[0.22em] text-ink-dim">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface-2 px-2 py-2.5 text-center">
      <div className="font-serif text-[26px] font-light leading-none text-gold">
        {value}
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </div>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 text-center text-xs text-ink-dim">{children}</div>
  );
}
