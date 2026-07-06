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
import { sendPasswordReset, signInStaff } from "@/services/auth";

type Mode = "signin" | "reset";

export default function LoginPage() {
  const { status, isStaff } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Only provisioned staff advance to the portal; a signed-in non-staff user
  // stays here and sees the access notice (no redirect loop with the guard).
  useEffect(() => {
    if (status === "signedIn" && isStaff) router.replace("/portal");
  }, [status, isStaff, router]);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setPassword("");
  }

  async function handleSignIn(e: React.FormEvent) {
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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordReset(email.trim());
      setNotice(
        "If that email is registered, a reset link is on its way. Check your inbox and spam.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
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

  const isReset = mode === "reset";

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
            {isReset ? "Reset Password" : "Staff Login"}
          </h1>
          <p className="mb-7 mt-1.5 text-[11px] tracking-[0.08em] text-ink-dim">
            {isReset
              ? "Enter your email and we'll send a reset link"
              : "Sign in with your assigned credentials"}
          </p>

          {isReset ? (
            <form onSubmit={handleReset} className="flex flex-col gap-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
              <Button type="submit" size="lg" fullWidth loading={pending} className="mt-2">
                {pending ? "Sending…" : "Send Reset Link →"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
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
              <div className="-mt-1 text-right">
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-[11px] tracking-[0.06em] text-ink-muted transition-colors hover:text-gold"
                >
                  Forgot password?
                </button>
              </div>
              <Button type="submit" size="lg" fullWidth loading={pending} className="mt-1">
                {pending ? "Signing in…" : "Sign In →"}
              </Button>
            </form>
          )}

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
            {notice && (
              <motion.p
                role="status"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-center text-xs leading-relaxed tracking-[0.04em] text-success"
              >
                {notice}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="my-6 h-px bg-edge" />
          {isReset ? (
            <p className="text-center text-[10px] leading-relaxed tracking-[0.08em] text-ink-dim">
              Remembered it?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-ink-muted underline-offset-2 transition-colors hover:text-gold hover:underline"
              >
                Back to sign in
              </button>
            </p>
          ) : (
            <p className="text-center text-[10px] leading-relaxed tracking-[0.08em] text-ink-dim">
              Contact your admin if you need an account
            </p>
          )}
        </Card>
      </motion.div>
    </main>
  );
}
