"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { ShiftType } from "@/types/domain";

export type ShiftTypesMap = Record<string, ShiftType>;

/** Live subscription to shift type definitions. */
export function useShiftTypes(): { shiftTypes: ShiftTypesMap; loading: boolean } {
  const [shiftTypes, setShiftTypes] = useState<ShiftTypesMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(clientDb(), dbPaths.shiftTypes), (snap) => {
      setShiftTypes((snap.val() as ShiftTypesMap | null) ?? {});
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { shiftTypes, loading };
}
