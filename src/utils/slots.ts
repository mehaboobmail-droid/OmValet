import { DEFAULT_SLOT_ROWS, DEFAULT_SLOTS_PER_ROW } from "@/constants";
import type { SlotConfig } from "@/types/domain";

export const DEFAULT_SLOT_CONFIG: SlotConfig = {
  rows: DEFAULT_SLOT_ROWS,
  perRow: DEFAULT_SLOTS_PER_ROW,
};

/** Expand a slot config into slot IDs: "A,B" × 2 → ["A-01","A-02","B-01","B-02"]. */
export function buildSlots(config: SlotConfig = DEFAULT_SLOT_CONFIG): string[] {
  return config.rows
    .split(",")
    .map((row) => row.trim().toUpperCase())
    .filter(Boolean)
    .flatMap((row) =>
      Array.from(
        { length: config.perRow },
        (_, i) => `${row}-${String(i + 1).padStart(2, "0")}`,
      ),
    );
}
