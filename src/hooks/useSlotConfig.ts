"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { SlotConfig } from "@/types/domain";
import { buildSlots, DEFAULT_SLOT_CONFIG } from "@/utils/slots";

/**
 * Live parking-grid configuration (`meta/slotConfig`), expanded to slot IDs.
 * Live (not one-shot like legacy) so admin slot changes propagate instantly.
 */
export function useSlotConfig(): {
  config: SlotConfig;
  slots: string[];
  loading: boolean;
} {
  const [config, setConfig] = useState<SlotConfig>(DEFAULT_SLOT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(clientDb(), dbPaths.slotConfig), (snap) => {
      const value = snap.val() as SlotConfig | null;
      setConfig(
        value?.rows && value?.perRow
          ? { rows: value.rows, perRow: Number(value.perRow) }
          : DEFAULT_SLOT_CONFIG,
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const slots = useMemo(() => buildSlots(config), [config]);

  return { config, slots, loading };
}
