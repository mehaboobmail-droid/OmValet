"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/useAuth";
import { useConnection } from "@/hooks/useConnection";
import { signOutStaff } from "@/services/auth";
import { LiveClock } from "./LiveClock";
import { UserPill } from "./UserPill";

interface PortalTab {
  href: string;
  label: string;
  icon: string;
  /** Accent used for the active state (legacy tab colours). */
  accent: "gold" | "green" | "blue";
  adminOnly?: boolean;
}

const TABS: PortalTab[] = [
  { href: "/portal", label: "Check-In", icon: "🗝", accent: "gold" },
  { href: "/portal/shifts", label: "My Shifts", icon: "📅", accent: "green" },
  { href: "/portal/admin", label: "Admin", icon: "⚙️", accent: "blue", adminOnly: true },
];

const activeClasses: Record<PortalTab["accent"], string> = {
  gold: "bg-gold text-obsidian font-medium",
  green: "bg-success text-obsidian font-medium",
  blue: "bg-info text-white font-medium",
};

const idleClasses: Record<PortalTab["accent"], string> = {
  gold: "text-ink-muted hover:text-ink hover:bg-surface-3",
  green: "text-success/80 hover:text-success hover:bg-surface-3",
  blue: "text-info/80 hover:text-info hover:bg-surface-3",
};

export function PortalNav() {
  const { role } = useAuth();
  const connected = useConnection();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOutStaff();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-obsidian/95 backdrop-blur-md">
      <nav className="flex min-h-[60px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-7">
        <Link
          href="/portal"
          className="font-serif text-xl font-light uppercase tracking-[0.35em] text-gold"
        >
          Valet{" "}
          <span className="text-xs normal-case italic tracking-[0.15em] text-ink-muted">
            Portal
          </span>
        </Link>

        <div className="order-3 flex w-full justify-center gap-1 rounded-lg border border-edge bg-surface-2 p-1 md:order-none md:w-auto">
          {TABS.filter((tab) => !tab.adminOnly || role === "admin").map(
            (tab) => {
              const active =
                tab.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors duration-200 sm:px-4",
                    active ? activeClasses[tab.accent] : idleClasses[tab.accent],
                  )}
                >
                  <span className="mr-1.5" aria-hidden="true">
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              );
            },
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            role="status"
            aria-label={connected ? "Connected" : "Disconnected"}
            title={connected ? "Realtime connection active" : "Reconnecting…"}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              connected
                ? "bg-success shadow-[0_0_5px_rgb(76_175_122/0.5)]"
                : "bg-danger animate-pulse",
            )}
          />
          <span className="hidden lg:block">
            <LiveClock />
          </span>
          <UserPill />
          <button
            onClick={handleSignOut}
            className="cursor-pointer rounded-md border border-edge px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-dim transition-colors duration-200 hover:border-danger hover:text-danger"
          >
            Sign Out
          </button>
        </div>
      </nav>
    </header>
  );
}
