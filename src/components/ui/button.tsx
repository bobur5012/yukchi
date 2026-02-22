import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — Apple HIG button
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold " +
  "transition-all duration-100 active:scale-[0.975] active:opacity-85 " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 " +
  "shrink-0 [&_svg]:shrink-0 outline-none " +
  "focus-visible:ring-2 focus-visible:ring-primary/40 " +
  "-webkit-tap-highlight-color-transparent",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 letter-spacing-[-0.01em]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border border-border bg-transparent hover:bg-accent text-foreground",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80",
        ghost:
          "hover:bg-accent hover:text-foreground text-foreground/70",
        link:
          "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-[50px] rounded-[14px] px-5 text-[16px]",
        sm:      "h-[40px] rounded-[12px] px-4 text-[15px] font-medium",
        lg:      "h-[50px] rounded-[14px] px-6 text-[16px]",
        xs:      "h-[32px] rounded-[10px] px-3 text-[13px] gap-1",
        icon:    "size-[44px] rounded-[12px] text-[16px]",
        "icon-sm": "size-[36px] rounded-[10px]",
        "icon-lg": "size-[50px] rounded-[14px]",
        "icon-xs": "size-[28px] rounded-[8px] [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
