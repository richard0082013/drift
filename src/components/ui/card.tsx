import React, { type HTMLAttributes, forwardRef } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={[
        "bg-white rounded-xl shadow-card",
        "border border-cream-200",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={["px-5 pt-5 pb-3", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardBody = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={["px-5 py-3", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
);
CardBody.displayName = "CardBody";

export const CardFooter = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={[
        "px-5 pt-3 pb-5 border-t border-cream-200",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
