import { cn } from "@/utils/cn";

interface CardProps extends React.ComponentProps<"div"> {
  /** glass = translucent with backdrop blur, for overlays on ambient bg. */
  variant?: "solid" | "glass";
}

export function Card({ variant = "solid", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-edge shadow-card",
        variant === "solid" && "bg-surface-1",
        variant === "glass" && "bg-surface-1/70 backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-edge px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "font-serif text-lg font-light tracking-[0.06em] text-gold-light",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}
