import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const alertVariants = cva(
  "relative w-full rounded-[var(--ossie-radius-card)] border p-[var(--ossie-space-4)] text-sm",
  {
    variants: {
      variant: {
        default:
          "border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-text)]",
        destructive:
          "border-[var(--ossie-color-danger)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-text)]",
        success:
          "border-[var(--ossie-color-success)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-text)]",
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
  ({ className, role, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(alertVariants({ variant }), className)}
      role={role ?? (variant === "destructive" ? "alert" : "status")}
      {...props}
    />
  ),
);

Alert.displayName = "Alert";

export const AlertTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-normal", className)}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-6 opacity-90", className)}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription";
