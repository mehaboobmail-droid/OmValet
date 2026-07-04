"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-obsidian font-medium hover:bg-gold-light hover:shadow-gold",
  outline:
    "border border-edge text-ink-muted hover:border-ink-muted hover:text-ink",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-2",
  danger:
    "border border-danger/30 text-danger hover:bg-danger/10 hover:border-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[10px]",
  md: "px-5 py-2.5 text-[11px]",
  lg: "px-6 py-3.5 text-[13px] min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-mono uppercase tracking-[0.13em] transition-colors duration-200 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-dim",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Spinner size="sm" tone={variant === "primary" ? "dark" : "gold"} />
      )}
      {children}
    </motion.button>
  );
}
