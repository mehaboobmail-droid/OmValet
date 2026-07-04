"use client";

import { useId } from "react";
import { cn } from "@/utils/cn";

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export interface InputProps
  extends React.ComponentProps<"input">,
    FieldWrapperProps {}

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    FieldWrapperProps {}

const fieldClasses =
  "w-full rounded-lg border border-edge bg-surface-2 px-4 py-3 font-mono text-sm text-ink outline-none transition-all duration-200 placeholder:text-ink-dim focus:border-gold-dim focus:bg-surface-3 focus:shadow-[0_0_0_3px_rgb(201_168_76/0.08)] disabled:cursor-not-allowed disabled:opacity-50";

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldWrapperProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-label">
          {label}
          {required && <span className="ml-1 text-gold">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[11px] tracking-[0.04em] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[10px] text-ink-dim">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  required,
  className,
  id: idProp,
  ...props
}: InputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(fieldClasses, error && "border-danger/50", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function Textarea({
  label,
  hint,
  error,
  required,
  className,
  id: idProp,
  ...props
}: TextareaProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(fieldClasses, "h-20 resize-none", error && "border-danger/50", className)}
        {...props}
      />
    </FieldShell>
  );
}
