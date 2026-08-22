import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--ossie-radius-control)] border px-2 py-0.5 text-xs font-semibold leading-5",
  {
    variants: {
      variant: {
        default:
          "border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface-subtle)] text-[var(--ossie-color-text-muted)]",
        success:
          "border-[var(--ossie-color-success)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-success)]",
        warning:
          "border-[var(--ossie-color-warning)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-warning)]",
        destructive:
          "border-[var(--ossie-color-danger)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-danger)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
