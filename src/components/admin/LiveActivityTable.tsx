"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/vehicles/StatusBadge";
import type { CarsMap } from "@/hooks/useCars";
import { sortCars } from "@/components/vehicles/CarsList";

/** Live activity across all valets (legacy admin table). */
export function LiveActivityTable({ cars }: { cars: CarsMap }) {
  const sorted = sortCars(cars);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Activity — All Valets</CardTitle>
        <Badge tone="success">{sorted.length} Active</Badge>
      </CardHeader>

      {sorted.length === 0 ? (
        <div className="p-5 text-center text-xs text-ink-dim">No active cars</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[80px_1.4fr_1.2fr_1fr_110px_70px] gap-2 border-b border-edge bg-surface-2 px-4 py-2 text-[10px] uppercase tracking-[0.13em] text-ink-dim">
              <div>Ticket</div>
              <div>Vehicle</div>
              <div>Guest</div>
              <div>Valet</div>
              <div>Status</div>
              <div>Time</div>
            </div>
            {sorted.map((car) => (
              <div
                key={car.id}
                className="grid grid-cols-[80px_1.4fr_1.2fr_1fr_110px_70px] items-center gap-2 border-b border-edge px-4 py-2.5 text-[11px] last:border-b-0 hover:bg-surface-2/50"
              >
                <div className="font-medium text-gold">{car.id}</div>
                <div className="truncate">
                  {car.plate} · {car.make} {car.model}
                </div>
                <div className="truncate">
                  {car.guest} · Rm {car.room}
                </div>
                <div className="truncate text-ink-muted">{car.valetName || "—"}</div>
                <div>
                  <StatusBadge status={car.status} />
                </div>
                <div className="text-ink-dim">{car.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
