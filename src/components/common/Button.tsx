import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none",
        {
          primary: "bg-accent text-white hover:bg-accent-hover",
          secondary: "border border-border bg-surface text-text-primary hover:bg-bg-secondary",
          ghost: "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
          danger: "bg-danger/10 text-danger hover:bg-danger/20",
        }[variant],
        {
          sm: "px-2.5 py-1 text-xs",
          md: "px-3.5 py-1.5 text-sm",
          lg: "px-4 py-2 text-base",
        }[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
