"use client";

import { AdminStats } from "@/components/admin/AdminStats";
import { CreateStaffForm } from "@/components/admin/CreateStaffForm";
import { LiveActivityTable } from "@/components/admin/LiveActivityTable";
import { ReportSection } from "@/components/admin/ReportSection";
import { SlotConfigCard } from "@/components/admin/SlotConfigCard";
import { StaffList } from "@/components/admin/StaffList";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCars } from "@/hooks/useCars";
import { useCheckedOutCount } from "@/hooks/useCheckedOutCount";
import { useSlotConfig } from "@/hooks/useSlotConfig";
import { useStaff } from "@/hooks/useStaff";

export default function AdminPage() {
  const { cars, loading: carsLoading } = useCars();
  const { staff, loading: staffLoading } = useStaff();
  const { config, loading: configLoading } = useSlotConfig();
  const checkedOut = useCheckedOutCount();

  if (carsLoading || staffLoading || configLoading) return <AdminSkeleton />;

  return (
    <div className="space-y-6 px-4 py-7 sm:px-7">
      <header>
        <h1 className="font-serif text-3xl font-light tracking-[0.05em]">
          Admin <span className="text-gold">Dashboard</span>
        </h1>
        <p className="mt-1 text-xs tracking-[0.06em] text-ink-muted">
          Manage staff · Monitor activity · View performance
        </p>
      </header>

      <AdminStats
        cars={cars}
        checkedOut={checkedOut}
        staffCount={Object.keys(staff).length}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CreateStaffForm />
        <SlotConfigCard current={config} />
      </div>

      <StaffList staff={staff} cars={cars} />

      <LiveActivityTable cars={cars} />

      <ReportSection cars={cars} />
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6 px-4 py-7 sm:px-7">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
