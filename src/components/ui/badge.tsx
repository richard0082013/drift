import React, { type HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "low" | "moderate" | "high" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  low: "bg-sage-100 text-sage-600 border-sage-200",
  moderate: "bg-amber-100 text-amber-600 border-amber-200",
  high: "bg-rose-100 text-rose-600 border-rose-200",
  info: "bg-coral-50 text-coral-600 border-coral-100"
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "info", className = "", ...props }, ref) => (
    <span
      ref={ref}
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "text-xs font-medium border",
        variantClasses[variant],
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
);

Badge.displayName = "Badge";
