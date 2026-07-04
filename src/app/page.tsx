"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/brand/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

/** Entry point — routes to the portal or login based on auth state. */
export default function Home() {
  const { status, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Non-staff signed-in users go to /login, which shows the access notice.
    if (status === "signedIn") router.replace(isStaff ? "/portal" : "/login");
    if (status === "signedOut") router.replace("/login");
  }, [status, isStaff, router]);

  return <LoadingScreen show tagline="Premium Car Management" />;
}
