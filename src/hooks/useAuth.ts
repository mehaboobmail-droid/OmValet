"use client";

import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { clientAuth } from "@/firebase/client";
import { fetchStaffIdentity } from "@/services/auth";
import type { StaffProfile, StaffRole } from "@/types/domain";

export type AuthStatus = "initializing" | "signedOut" | "signedIn";

interface AuthUser {
  uid: string;
  email: string | null;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  role: StaffRole | null;
  /** True only for provisioned staff (admin flag or a staff profile). */
  isStaff: boolean;
  profile: StaffProfile | null;
  displayName: string;
}

export const useAuthStore = create<AuthState>(() => ({
  status: "initializing",
  user: null,
  role: null,
  isStaff: false,
  profile: null,
  displayName: "",
}));

let listenerStarted = false;

/**
 * Start the global Firebase auth listener (idempotent).
 * Mounted once via <AuthProvider> in the root layout.
 */
export function startAuthListener(): void {
  if (listenerStarted) return;
  listenerStarted = true;

  onAuthStateChanged(clientAuth(), async (user) => {
    if (!user) {
      useAuthStore.setState({
        status: "signedOut",
        user: null,
        role: null,
        isStaff: false,
        profile: null,
        displayName: "",
      });
      return;
    }

    try {
      const identity = await fetchStaffIdentity(user);
      useAuthStore.setState({
        status: "signedIn",
        user: { uid: user.uid, email: user.email },
        role: identity.role,
        isStaff: identity.isStaff,
        profile: identity.profile,
        displayName: identity.displayName,
      });
    } catch {
      // Identity lookup failed (network/rules) — fail closed: signed in but
      // not treated as staff, so access is denied until it can be verified.
      useAuthStore.setState({
        status: "signedIn",
        user: { uid: user.uid, email: user.email },
        role: "valet",
        isStaff: false,
        profile: null,
        displayName: user.email ?? "Staff",
      });
    }
  });
}

/** Convenience selector hook. */
export function useAuth(): AuthState {
  return useAuthStore();
}
