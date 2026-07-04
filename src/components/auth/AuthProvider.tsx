"use client";

import { useEffect } from "react";
import { startAuthListener } from "@/hooks/useAuth";

/** Boots the global auth listener. Renders nothing. */
export function AuthProvider() {
  useEffect(() => {
    startAuthListener();
  }, []);
  return null;
}
