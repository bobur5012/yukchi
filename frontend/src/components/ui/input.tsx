import * as React from "react"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  inputSize,
  ...props
}: React.ComponentProps<"input"> & { inputSize?: "default" | "lg" | "xl" }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={inputSize}
      className={cn(
        // Base — Apple HIG field
        "w-full min-w-0 rounded-xl border border-border",
        "bg-muted/50 px-[14px] text-[16px] text-foreground",
        "placeholder:text-muted-foreground/70",
        "transition-[border-color,box-shadow] duration-150 outline-none",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        // Size variants — all compact Apple-style
        inputSize === "xl"
          ? "h-[48px] py-0"
          : inputSize === "lg"
            ? "h-[44px] py-0"
            : "h-[44px] py-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }
