"use client";

import { cn } from "@/utils/cn";

interface SlotGridProps {
  slots: string[];
  occupied: ReadonlySet<string>;
  selected: string | null;
  onSelect: (slot: string) => void;
}

/** Live parking grid: available / selected / occupied (legacy colour language). */
export function SlotGrid({ slots, occupied, selected, onSelect }: SlotGridProps) {
  return (
    <div>
      <div className="mb-2 flex gap-4">
        <Legend swatch="border border-edge bg-surface-3" label="Available" />
        <Legend swatch="border border-gold bg-gold/20" label="Selected" />
        <Legend swatch="border border-danger/30 bg-danger/10" label="Occupied" />
      </div>
      <div
        role="listbox"
        aria-label="Parking slots"
        className="grid grid-cols-6 gap-1 sm:grid-cols-8 lg:grid-cols-10"
      >
        {slots.map((slot) => {
          const isOccupied = occupied.has(slot);
          const isSelected = slot === selected;
          return (
            <button
              key={slot}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={isOccupied}
              onClick={() => onSelect(slot)}
              className={cn(
                "flex aspect-square items-center justify-center rounded border text-[8px] font-medium transition-all duration-150 sm:text-[9px]",
                isSelected &&
                  "border-gold bg-gold/20 text-gold shadow-[0_0_10px_rgb(201_168_76/0.2)]",
                isOccupied &&
                  "cursor-not-allowed border-danger/20 bg-danger/10 text-danger opacity-60",
                !isSelected &&
                  !isOccupied &&
                  "cursor-pointer border-edge bg-surface-3 text-ink-muted hover:border-gold-dim hover:bg-gold/10 hover:text-gold",
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
      <span className={cn("size-2 rounded-sm", swatch)} />
      {label}
    </span>
  );
}
