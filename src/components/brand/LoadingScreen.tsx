"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";

/**
 * Full-screen branded loading overlay. Render with `show` bound to your
 * loading state — it fades out and unmounts when ready.
 */
export function LoadingScreen({
  show,
  tagline,
}: {
  show: boolean;
  tagline?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-7 bg-obsidian"
        >
          <motion.div
            initial={{ opacity: 0, letterSpacing: "0.6em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandLogo size="md" tagline={tagline} />
          </motion.div>
          <div className="flex gap-2" aria-label="Loading" role="status">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-gold-dim"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
