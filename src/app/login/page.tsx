"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LoadingScreen } from "@/components/brand/LoadingScreen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { useAuth } from "@/hooks/useAuth";
import { signInStaff } from "@/services/auth";

export default function LoginPage() {
  const { status, isStaff } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // Only provisioned staff advance to the portal; a signed-in non-staff user
  // stays here and sees the access notice (no redirect loop with the guard).
  useEffect(() => {
    if (status === "signedIn" && isStaff) router.replace("/portal");
  }, [status, isStaff, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }
    setPending(true);
    setError("");
    try {
      await signInStaff(email.trim(), password);
      // Redirect handled by the auth listener effect above.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
      setPending(false);
    }
  }

  // Signed in but not provisioned staff — show the access notice here too.
  if (status === "signedIn" && !isStaff) {
    return <AccessDenied />;
  }

  // Branded overlay while auth state resolves or a redirect is in flight.
  if (status !== "signedOut") {
    return <LoadingScreen show tagline="Premium Car Management" />;
  }

  return (
    <main className="bg-ambient flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        <BrandLogo size="lg" tagline="Premium Car Management" className="mb-12" />

        <Card className="p-8">
          <h1 className="font-serif text-[22px] font-light tracking-[0.08em] text-gold-light">
            Staff Login
          </h1>
          <p className="mb-7 mt-1.5 text-[11px] tracking-[0.08em] text-ink-dim">
            Sign in with your assigned credentials
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={pending}
              className="mt-2"
            >
              {pending ? "Signing in…" : "Sign In →"}
            </Button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden rounded-lg border border-danger/25 bg-danger/10 px-4 py-3 text-center text-xs tracking-[0.04em] text-danger"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="my-6 h-px bg-edge" />
          <p className="text-center text-[10px] leading-relaxed tracking-[0.08em] text-ink-dim">
            Contact your admin if you forgot your credentials
          </p>
        </Card>
      </motion.div>
    </main>
  );
}
