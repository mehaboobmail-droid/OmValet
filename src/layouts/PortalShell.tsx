import { PortalNav } from "@/components/portal/PortalNav";

/** Chrome for all staff portal routes: sticky nav + content region. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PortalNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
