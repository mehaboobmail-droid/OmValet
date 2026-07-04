import { cn } from "@/utils/cn";

/** Gold-shimmer loading placeholder. Size it with width/height classes. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("shimmer rounded-lg", className)}
      {...props}
    />
  );
}
