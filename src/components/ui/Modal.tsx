"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Tailwind max-width class for the panel. */
  maxWidth?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  maxWidth = "max-w-md",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn(
              "w-full overflow-hidden rounded-card border border-gold-dim bg-surface-1 shadow-modal",
              "max-h-[90dvh] overflow-y-auto",
              maxWidth,
            )}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-edge px-5 py-4">
                <h3 className="font-serif text-lg font-light tracking-[0.1em] text-gold-light">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-edge bg-surface-2 text-xs text-ink-muted transition-colors hover:border-danger hover:text-danger"
                >
                  ✕
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
