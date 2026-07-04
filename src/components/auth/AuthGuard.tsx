"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/brand/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  /** When true, valets are bounced back to /portal. */
  requireAdmin?: boolean;
  children: React.ReactNode;
}

/**
 * Client-side route guard for staff areas.
 * Shows the branded loading screen while auth resolves; redirects to /login
 * when signed out (legacy portal behaviour).
 */
export function AuthGuard({ requireAdmin = false, children }: AuthGuardProps) {
  const { status, role } = useAuth();
  const router = useRouter();

  const denied =
    status === "signedOut" ||
    (requireAdmin && status === "signedIn" && role !== "admin");

  useEffect(() => {
    if (status === "signedOut") {
      router.replace("/login");
    } else if (requireAdmin && status === "signedIn" && role !== "admin") {
      router.replace("/portal");
    }
  }, [status, role, requireAdmin, router]);

  if (status !== "signedIn" || denied) {
    return <LoadingScreen show tagline="Portal" />;
  }

  return <>{children}</>;
}
