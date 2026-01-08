import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wider ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-3 border-border font-brutal",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        destructive: "bg-destructive text-destructive-foreground shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline: "border-3 border-border bg-background shadow-brutal hover:bg-accent hover:text-accent-foreground hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        secondary: "bg-secondary text-secondary-foreground shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground border-0 shadow-none",
        link: "text-primary underline-offset-4 hover:underline border-0 shadow-none font-mono",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4",
        lg: "h-14 px-10 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
