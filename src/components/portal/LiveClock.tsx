"use client";

import { useEffect, useState } from "react";

/** HH:MM:SS clock (hotel-local display). Renders after mount to avoid hydration mismatch. */
export function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-[11px] tracking-[0.1em] text-ink-dim tabular-nums">
      {time || "--:--:--"}
    </span>
  );
}
