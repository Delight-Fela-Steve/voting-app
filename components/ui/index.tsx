import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

type BadgeVariant = "live" | "default";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

const badgeVariants: Record<BadgeVariant, string> = {
  live: "bg-live/15 text-live border-live/30",
  default: "bg-surface-raised text-text-muted border-border",
};

export function Badge({
  variant = "default",
  children,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeVariants[variant]} ${className}`}
      {...props}
    >
      {variant === "live" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover focus-visible:outline-accent",
  ghost:
    "border border-border bg-transparent text-text-primary hover:bg-surface-raised focus-visible:outline-accent",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-500",
};

export function Button({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
