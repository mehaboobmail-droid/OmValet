"use client";

import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/useAuth";

/** Avatar + name + role chip, styled per role (admin = blue, valet = gold). */
export function UserPill() {
  const { displayName, role } = useAuth();
  const isAdmin = role === "admin";

  return (
    <div className="flex items-center gap-2 rounded-full border border-edge bg-surface-2 py-1 pl-1 pr-3">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-obsidian",
          isAdmin ? "bg-info" : "bg-gold",
        )}
      >
        {(displayName || "?").charAt(0).toUpperCase()}
      </span>
      <span className="hidden max-w-[110px] truncate text-[11px] text-ink-muted sm:block">
        {displayName}
      </span>
      <span
        className={cn(
          "hidden rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] md:block",
          isAdmin
            ? "border-info/30 bg-info/15 text-info"
            : "border-gold/25 bg-gold/12 text-gold",
        )}
      >
        {role}
      </span>
    </div>
  );
}
