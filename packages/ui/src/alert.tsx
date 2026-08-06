import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { controlShapeClasses } from "./primitive-classes";

const alertVariants = cva(
  `relative w-full ${controlShapeClasses} border p-[var(--ossie-space-4)]`,
  {
  variants: {
    variant: {
      default:
        "border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-text)]",
      destructive:
        "border-[var(--ossie-color-danger-border)] bg-[var(--ossie-color-danger-subtle)] text-[var(--ossie-color-danger-text)]",
      success:
        "border-[var(--ossie-color-success-border)] bg-[var(--ossie-color-success-subtle)] text-[var(--ossie-color-success-text)]",
      warning:
        "border-[var(--ossie-color-warning-border)] bg-[var(--ossie-color-warning-subtle)] text-[var(--ossie-color-warning-text)]",
    },
  },
  defaultVariants: {
    variant: "default",
    },
  },
);

export type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(alertVariants({ variant }), className)} role="status" {...props} />
  )
);

Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(
        "mb-1 font-semibold leading-none tracking-normal",
        className,
      )}
      {...props}
    />
  )
);

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "[font-size:var(--ossie-font-size-sm)] [line-height:var(--ossie-line-height-normal)] opacity-90",
        className,
      )}
      {...props}
    />
  )
);

AlertDescription.displayName = "AlertDescription";
