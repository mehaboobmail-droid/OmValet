import { cn } from "@/utils/cn";

export type BadgeTone =
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  gold: "bg-gold/15 text-gold border-gold/30",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  info: "bg-info/12 text-info border-info/25",
  neutral: "bg-surface-2 text-ink-muted border-edge",
};

interface BadgeProps extends React.ComponentProps<"span"> {
  tone?: BadgeTone;
  pulse?: boolean;
}

export function Badge({ tone = "gold", pulse, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
