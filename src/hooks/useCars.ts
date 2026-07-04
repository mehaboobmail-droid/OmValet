"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { Car } from "@/types/domain";

export type CarsMap = Record<string, Car>;

/** Live subscription to all active vehicles (`cars` node). */
export function useCars(): { cars: CarsMap; loading: boolean } {
  const [cars, setCars] = useState<CarsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(clientDb(), dbPaths.cars), (snap) => {
      setCars((snap.val() as CarsMap | null) ?? {});
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { cars, loading };
}
