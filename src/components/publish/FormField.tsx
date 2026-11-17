import type { ReactNode } from "react";

interface FormFieldProps {
  /** Must match the input's id so the label and error are connected. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}

/** Label + input + hint + error, with consistent spacing and accessibility wiring. */
export function FormField({ id, label, hint, error, optional, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
        {label}
        {optional && <span className="text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared input styling. `invalid` adds the error ring. */
export function inputClass(invalid?: boolean): string {
  return `w-full rounded-xl bg-surface-2 px-4 py-3 text-[16px] outline-none ring-1 transition placeholder:text-muted focus:ring-2 focus:ring-accent ${
    invalid ? "ring-accent" : "ring-transparent"
  }`;
}
