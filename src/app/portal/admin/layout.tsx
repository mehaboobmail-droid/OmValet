import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata = { title: "Admin" };

/** Valets are redirected back to /portal (legacy tab visibility, enforced). */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthGuard requireAdmin>{children}</AuthGuard>;
}
