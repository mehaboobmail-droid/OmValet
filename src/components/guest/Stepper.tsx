import { cn } from "@/utils/cn";

/**
 * 4-step guest journey indicator. Step 1 (SMS received) is always done —
 * legacy behaviour.
 */
export function Stepper({ current }: { current: 2 | 3 | 4 }) {
  const steps = [1, 2, 3, 4] as const;
  return (
    <div className="flex items-center justify-center px-6 pt-5" aria-hidden="true">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          {i > 0 && (
            <div
              className={cn(
                "h-px w-10 max-w-[60px] sm:w-14",
                step <= current ? "bg-gold-dim" : "bg-edge",
              )}
            />
          )}
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full border text-[11px] font-medium transition-all duration-300",
              step < current && "border-gold bg-gold text-obsidian",
              step === current && "border-gold bg-gold/10 text-gold",
              step > current && "border-edge bg-surface-2 text-ink-muted",
            )}
          >
            {step < current ? "✓" : step}
          </div>
        </div>
      ))}
    </div>
  );
}
