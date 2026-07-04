"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/brand/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

/** Entry point — routes to the portal or login based on auth state. */
export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedIn") router.replace("/portal");
    if (status === "signedOut") router.replace("/login");
  }, [status, router]);

  return <LoadingScreen show tagline="Premium Car Management" />;
}
