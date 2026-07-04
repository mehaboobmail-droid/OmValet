"use client";

import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { signOutStaff } from "@/services/auth";

/**
 * Shown to a user who is authenticated but not provisioned staff (no admin
 * flag and no `valets/{uid}` profile), or whose identity could not be
 * verified. Prevents self-registered accounts from reaching the portal.
 */
export function AccessDenied() {
  const router = useRouter();

  async function handleSignOut() {
    await signOutStaff();
    router.replace("/login");
  }

  return (
    <main className="bg-ambient flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <BrandLogo size="md" tagline="Premium Car Management" />
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="text-3xl" aria-hidden="true">
            🔒
          </span>
          <h1 className="font-serif text-xl font-light tracking-[0.06em]">
            Access Not Authorized
          </h1>
          <p className="max-w-xs text-[12px] leading-relaxed text-ink-muted">
            This account isn&apos;t registered as valet staff. Contact your
            administrator to be added, then sign in again.
          </p>
          <div className="mt-1 flex gap-2.5">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
