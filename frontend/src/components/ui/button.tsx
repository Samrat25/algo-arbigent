import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-black text-foreground border border-primary shadow-[0_0_15px_rgba(255,138,0,0.4)] hover:shadow-[0_0_30px_rgba(255,138,0,0.8)]",
        destructive: "bg-black text-destructive-foreground border border-destructive hover:shadow-[0_0_30px_rgba(255,0,0,0.5)]",
        outline: "bg-black text-foreground border border-primary shadow-[0_0_10px_rgba(255,138,0,0.2)] hover:shadow-[0_0_20px_rgba(255,138,0,0.6)]",
        secondary: "bg-black text-foreground border border-primary shadow-[0_0_15px_rgba(255,138,0,0.4)] hover:shadow-[0_0_30px_rgba(255,138,0,0.8)]",
        ghost: "hover:bg-white/5 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-black text-foreground border border-primary shadow-[0_0_20px_rgba(255,138,0,0.6)] hover:shadow-[0_0_40px_rgba(255,138,0,1)] font-semibold",
        heroOutline: "bg-black text-foreground border border-primary shadow-[0_0_10px_rgba(255,138,0,0.3)] hover:shadow-[0_0_25px_rgba(255,138,0,0.7)] font-medium",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
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
