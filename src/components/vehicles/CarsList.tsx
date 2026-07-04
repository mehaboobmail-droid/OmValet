"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { TicketModal } from "@/components/checkin/TicketModal";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import type { CarsMap } from "@/hooks/useCars";
import { toast } from "@/hooks/useToast";
import { checkOutVehicle, markCarReady } from "@/services/retrieval";
import type { Car, CarStatus } from "@/types/domain";
import { CarCard } from "./CarCard";

/** Urgency-first ordering (legacy rule), then ticket number. */
const STATUS_ORDER: Record<CarStatus, number> = {
  requesting: 0,
  ready: 1,
  scheduled: 2,
  parked: 3,
};

export function sortCars(cars: CarsMap): Car[] {
  return Object.values(cars).sort((a, b) => {
    const byStatus = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (byStatus !== 0) return byStatus;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

export function CarsList({ cars }: { cars: CarsMap }) {
  const { user, displayName } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [printCar, setPrintCar] = useState<Car | null>(null);

  const sorted = useMemo(() => sortCars(cars), [cars]);

  async function handleReady(car: Car) {
    if (!user) return;
    setBusyId(car.id);
    try {
      await markCarReady(car, { uid: user.uid, name: displayName });
      toast.gold("Car Ready", `${car.plate} at porch`, "🚗");
    } catch (error) {
      toast.error("Update Failed", error instanceof Error ? error.message : "");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCheckout(car: Car) {
    if (!user) return;
    setBusyId(car.id);
    try {
      await checkOutVehicle(car, { uid: user.uid, name: displayName });
      toast.success("Checked Out", `${car.plate} handed over`);
    } catch (error) {
      toast.error(
        "Checkout Failed",
        error instanceof Error ? error.message : "Try again",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-light tracking-[0.05em]">
          Parked <span className="text-gold">Vehicles</span>
        </h2>
        <Badge tone="gold">{sorted.length} Active</Badge>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-edge py-9 text-center text-xs text-ink-dim">
          No vehicles checked in
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {sorted.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                busy={busyId === car.id}
                onPrint={setPrintCar}
                onReady={handleReady}
                onCheckout={handleCheckout}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reprint from a card: SMS already went out at check-in (legacy rule) */}
      <TicketModal
        car={printCar}
        smsSent
        onClose={() => setPrintCar(null)}
      />
    </section>
  );
}
