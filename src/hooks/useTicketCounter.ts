"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { TICKET_COUNTER_START, TICKET_PREFIX } from "@/constants";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";

/** Live "next ticket number" display, e.g. "V-1043". */
export function useNextTicket(): string {
  const [counter, setCounter] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(ref(clientDb(), dbPaths.ticketCounter), (snap) => {
      setCounter((snap.val() as number | null) ?? TICKET_COUNTER_START);
    });
    return unsubscribe;
  }, []);

  return counter === null ? "…" : `${TICKET_PREFIX}-${counter + 1}`;
}
