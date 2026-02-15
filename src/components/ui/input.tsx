import React, { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full px-3 py-2 rounded-lg text-sm text-slate-700",
            "bg-white border transition-colors duration-200",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-rose-400 focus:ring-rose-200"
              : "border-cream-200 focus:ring-coral-200 focus:border-coral-400",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-rose-500" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
