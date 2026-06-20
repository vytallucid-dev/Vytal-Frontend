import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        /* neutral chip — surface2 + line2 + ink2 (the default) */
        default:
          "border-line2 bg-surface-2 text-ink2 [a&]:hover:text-foreground [a&]:hover:border-line3",
        secondary:
          "border-line2 bg-surface-2 text-foreground [a&]:hover:bg-surface-3",
        outline:
          "border-line2 text-ink2 [a&]:hover:text-foreground [a&]:hover:border-line3",
        /* semantic severity — soft -bg fill + -bd border + colored ink */
        destructive:
          "border-danger/40 bg-danger/12 font-medium text-danger [a&]:hover:bg-danger/20",
        success:
          "border-success/40 bg-success/12 font-medium text-success [a&]:hover:bg-success/20",
        warning:
          "border-warning/38 bg-warning/12 font-medium text-warning [a&]:hover:bg-warning/20",
        info:
          "border-info/40 bg-info/12 font-medium text-info [a&]:hover:bg-info/20",
        brand:
          "border-primary/40 bg-primary/12 font-medium text-primary [a&]:hover:bg-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
