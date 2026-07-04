import { cn } from "@/utils/cn";

type LogoSize = "sm" | "md" | "lg";

const sizeClasses: Record<LogoSize, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-[42px]",
};

/** Serif gold wordmark used across login, portal nav and guest pages. */
export function BrandLogo({
  size = "md",
  tagline,
  className,
}: {
  size?: LogoSize;
  tagline?: string;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <div
        className={cn(
          "font-serif font-light uppercase tracking-[0.4em] text-gold",
          sizeClasses[size],
        )}
      >
        Valet
      </div>
      {tagline && (
        <div className="mt-1.5 text-[10px] uppercase tracking-[0.3em] text-ink-dim">
          {tagline}
        </div>
      )}
    </div>
  );
}
