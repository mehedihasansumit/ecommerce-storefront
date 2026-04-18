"use client";

import { cloneElement, isValidElement, useId } from "react";
import type { ReactElement, ReactNode } from "react";

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  htmlFor?: string;
  children: ReactElement<{
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }>;
  className?: string;
}

export function Field({
  label,
  hint,
  error,
  required,
  optional,
  htmlFor,
  children,
  className,
}: FieldProps) {
  const reactId = useId();
  const existingId = isValidElement(children) ? children.props.id : undefined;
  const id = htmlFor ?? existingId ?? reactId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const clonedChild = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        ...(error ? { "aria-invalid": true as const } : {}),
      })
    : children;

  return (
    <div className={["space-y-1.5", className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {optional && (
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          )}
        </label>
      )}
      {clonedChild}
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500 dark:text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
