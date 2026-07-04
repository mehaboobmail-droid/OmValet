"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";

/**
 * Live Realtime Database connection state.
 * The legacy portal showed a hardcoded green dot — this one is real.
 */
export function useConnection(): boolean {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(ref(clientDb(), ".info/connected"), (snap) => {
      setConnected(snap.val() === true);
    });
    return unsubscribe;
  }, []);

  return connected;
}
