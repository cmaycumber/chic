import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/70",
        link: "text-foreground underline-offset-4 hover:underline",
        brass:
          "bg-[var(--accent-brass)] text-white shadow-sm hover:bg-[var(--accent-brass)]/90 active:bg-[var(--accent-brass)]/80",
        coral:
          "bg-[var(--accent-coral)] text-white shadow-sm hover:bg-[var(--accent-coral)]/90 active:bg-[var(--accent-coral)]/80",
        cta: "bg-[var(--accent-cta)] text-white shadow-md hover:bg-[var(--accent-cta)]/90 hover:shadow-lg active:bg-[var(--accent-cta)]/80",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-sm has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
