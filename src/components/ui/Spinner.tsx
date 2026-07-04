import { cn } from "@/utils/cn";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerTone = "gold" | "dark" | "muted";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-3.5 border-2",
  md: "size-5 border-2",
  lg: "size-8 border-[3px]",
};

const toneClasses: Record<SpinnerTone, string> = {
  gold: "border-gold/25 border-t-gold",
  dark: "border-obsidian/25 border-t-obsidian",
  muted: "border-edge border-t-ink-muted",
};

export function Spinner({
  size = "md",
  tone = "gold",
  className,
}: {
  size?: SpinnerSize;
  tone?: SpinnerTone;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
    />
  );
}
