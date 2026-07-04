"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { StaffProfile } from "@/types/domain";

export type StaffMap = Record<string, StaffProfile>;

/** Live subscription to all staff profiles (`valets` node). */
export function useStaff(): { staff: StaffMap; loading: boolean } {
  const [staff, setStaff] = useState<StaffMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(clientDb(), dbPaths.staff), (snap) => {
      setStaff((snap.val() as StaffMap | null) ?? {});
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { staff, loading };
}
