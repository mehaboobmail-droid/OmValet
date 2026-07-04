"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import type { CarsMap } from "@/hooks/useCars";

interface AdminStatsProps {
  cars: CarsMap;
  checkedOut: number;
  staffCount: number;
}

/** Legacy 5-stat header row, with animated counters. */
export function AdminStats({ cars, checkedOut, staffCount }: AdminStatsProps) {
  const all = Object.values(cars);
  const stats = [
    { label: "Total Today", value: all.length + checkedOut },
    { label: "Parked", value: all.filter((c) => c.status === "parked").length },
    {
      label: "Awaiting",
      value: all.filter((c) => c.status === "requesting" || c.status === "ready")
        .length,
    },
    { label: "Checked Out", value: checkedOut },
    { label: "Active Valets", value: staffCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-edge bg-surface-1 px-4 py-4 text-center"
        >
          <div className="font-serif text-4xl font-light leading-none text-gold">
            <AnimatedNumber value={stat.value} />
          </div>
          <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-ink-muted">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 120, damping: 22 });
  const display = useTransform(spring, (v) => String(Math.round(v)));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}
