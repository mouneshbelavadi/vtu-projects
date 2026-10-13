import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  id: string;
  label: string;
  helpText?: string;
  errorText?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    hasError: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    required?: boolean;
  }) => React.ReactNode;
}

/**
 * FormField wrapper coordinating labels, accessible help text, and validation error messages.
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  helpText,
  errorText,
  required,
  className,
  children,
}) => {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = errorText ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;
  const hasError = Boolean(errorText);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id,
        hasError,
        "aria-describedby": describedBy,
        "aria-invalid": hasError,
        required,
      })}

      {errorText && (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {errorText}
        </p>
      )}

      {helpText && !errorText && (
        <p id={helpId} className="text-sm text-ink-3">
          {helpText}
        </p>
      )}
    </div>
  );
};
