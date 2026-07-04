import { AuthGuard } from "@/components/auth/AuthGuard";
import { PortalShell } from "@/layouts/PortalShell";

export const metadata = { title: "Portal" };

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <PortalShell>{children}</PortalShell>
    </AuthGuard>
  );
}
