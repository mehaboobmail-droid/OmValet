"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/brand/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { AccessDenied } from "./AccessDenied";

interface AuthGuardProps {
  /** When true, valets are bounced back to /portal. */
  requireAdmin?: boolean;
  children: React.ReactNode;
}

/**
 * Client-side route guard for staff areas.
 * - Signed out → redirect to /login.
 * - Signed in but not staff → "Access not authorized" (no redirect loop).
 * - Admin-only area + non-admin → bounce to /portal.
 */
export function AuthGuard({ requireAdmin = false, children }: AuthGuardProps) {
  const { status, role, isStaff } = useAuth();
  const router = useRouter();

  const notStaff = status === "signedIn" && !isStaff;
  const wrongRole =
    requireAdmin && status === "signedIn" && isStaff && role !== "admin";

  useEffect(() => {
    if (status === "signedOut") {
      router.replace("/login");
    } else if (wrongRole) {
      router.replace("/portal");
    }
  }, [status, wrongRole, router]);

  if (notStaff) return <AccessDenied />;

  if (status !== "signedIn" || wrongRole) {
    return <LoadingScreen show tagline="Portal" />;
  }

  return <>{children}</>;
}
