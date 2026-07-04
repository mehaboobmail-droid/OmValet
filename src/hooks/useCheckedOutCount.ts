"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";

/** Live `meta/checkedOutCount` (legacy running counter shown in the sidebar). */
export function useCheckedOutCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onValue(ref(clientDb(), dbPaths.checkedOutCount), (snap) => {
      setCount((snap.val() as number | null) ?? 0);
    });
    return unsubscribe;
  }, []);

  return count;
}
