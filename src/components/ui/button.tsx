import React, { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-coral-500 text-white shadow-button hover:bg-coral-600 focus-visible:ring-coral-300",
  secondary:
    "bg-cream-100 text-slate-700 hover:bg-cream-200 focus-visible:ring-coral-200",
  danger:
    "bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-300",
  ghost:
    "bg-transparent text-slate-600 hover:bg-cream-100 focus-visible:ring-coral-200"
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center font-medium cursor-pointer",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
