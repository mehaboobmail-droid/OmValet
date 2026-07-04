"use client";

import { CheckInForm } from "@/components/checkin/CheckInForm";
import { CarsList } from "@/components/vehicles/CarsList";
import { SidePanel } from "@/components/vehicles/SidePanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCars } from "@/hooks/useCars";
import { useSlotConfig } from "@/hooks/useSlotConfig";

/** Valet desk: check-in + parked vehicles, with live queue sidebar (legacy layout). */
export default function CheckInPage() {
  const { cars, loading: carsLoading } = useCars();
  const { slots, loading: slotsLoading } = useSlotConfig();
  const loading = carsLoading || slotsLoading;

  if (loading) return <PageSkeleton />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-7 px-4 py-6 sm:px-7 lg:border-r lg:border-edge">
        <CheckInForm cars={cars} slots={slots} />
        <CarsList cars={cars} />
      </div>

      <div className="bg-surface-1/50 px-4 py-6 sm:px-5">
        <div className="lg:sticky lg:top-[76px]">
          <SidePanel cars={cars} />
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px]">
      <div className="space-y-6 px-4 py-6 sm:px-7">
        <div className="rounded-card border border-edge bg-surface-1 p-6">
          <Skeleton className="mb-5 h-6 w-48" />
          <Skeleton className="mb-4 h-14 w-full" />
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="mb-3 h-28 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="hidden space-y-4 px-5 py-6 lg:block">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
