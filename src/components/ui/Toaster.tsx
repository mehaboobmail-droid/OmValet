"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore, type ToastTone } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

const toneClasses: Record<ToastTone, string> = {
  success: "border-success/40 text-success",
  error: "border-danger/40 text-danger",
  warning: "border-warning/40 text-warning",
  info: "border-info/40 text-info",
  gold: "border-gold-dim text-gold",
};

/** Global toast outlet — mounted once in the root layout. */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[290px] max-w-[calc(100vw-3rem)] flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex cursor-pointer items-start gap-2.5 rounded-lg border bg-surface-2/95 px-4 py-3 shadow-card backdrop-blur-md",
              toneClasses[t.tone],
            )}
          >
            {t.icon && <span className="text-sm leading-5">{t.icon}</span>}
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.1em]">
                {t.title}
              </div>
              {t.message && (
                <div className="mt-0.5 truncate text-xs text-ink-muted">
                  {t.message}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
