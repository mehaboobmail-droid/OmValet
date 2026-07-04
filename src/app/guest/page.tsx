"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "@/components/brand/LoadingScreen";
import { OtpScreen } from "@/components/guest/OtpScreen";
import { ScheduleScreen } from "@/components/guest/ScheduleScreen";
import { StatusScreen } from "@/components/guest/StatusScreen";
import { Stepper } from "@/components/guest/Stepper";
import type { GuestSession } from "@/services/guest/client";
import { formatTime } from "@/utils/date";

type Screen = "otp" | "schedule" | "status";

const SCREEN_STEP: Record<Screen, 2 | 3 | 4> = {
  otp: 2,
  schedule: 3,
  status: 4,
};

export default function GuestPage() {
  return (
    <Suspense fallback={<LoadingScreen show tagline="Car Retrieval" />}>
      <GuestFlow />
    </Suspense>
  );
}

function GuestFlow() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticket");

  const [intro, setIntro] = useState(true);
  const [screen, setScreen] = useState<Screen>("otp");
  const [session, setSession] = useState<GuestSession | null>(null);
  const [mode, setMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [requestedAt, setRequestedAt] = useState("");

  // Brief branded intro (legacy 800ms loading beat).
  useEffect(() => {
    const timer = setTimeout(() => setIntro(false), 800);
    return () => clearTimeout(timer);
  }, []);

  function resetToOtp() {
    setSession(null);
    setMode("immediate");
    setScheduledTime(null);
    setScreen("otp");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <LoadingScreen show={intro} tagline="Car Retrieval" />

      <Stepper current={SCREEN_STEP[screen]} />

      <main className="mx-auto max-w-[480px] px-5 pb-20 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "otp" && (
              <OtpScreen
                ticketId={ticketId}
                onVerified={(s) => {
                  setSession(s);
                  setScreen("schedule");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {screen === "schedule" && session && (
              <ScheduleScreen
                session={session}
                onBack={resetToOtp}
                onConfirmed={(m, t) => {
                  setMode(m);
                  setScheduledTime(t);
                  setRequestedAt(formatTime());
                  setScreen("status");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {screen === "status" && session && (
              <StatusScreen
                session={session}
                mode={mode}
                scheduledTime={scheduledTime}
                requestedAt={requestedAt}
                onBack={resetToOtp}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
