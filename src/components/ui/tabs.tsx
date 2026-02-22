"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  // Apple-style segmented control
  "inline-flex items-center justify-center rounded-[11px] p-1 " +
  "group/tabs-list text-muted-foreground " +
  "group-data-[orientation=horizontal]/tabs:h-[38px] " +
  "group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-muted/80",
        line:    "gap-1 bg-transparent rounded-none",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "relative inline-flex flex-1 items-center justify-center whitespace-nowrap " +
        "text-[14px] font-medium transition-all duration-150 outline-none " +
        "rounded-[8px] px-3 h-[calc(100%-2px)] gap-1.5 " +
        "text-muted-foreground hover:text-foreground " +
        "focus-visible:ring-2 focus-visible:ring-primary/30 " +
        "disabled:pointer-events-none disabled:opacity-40 " +
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        // Active — iOS segmented control pill
        "data-[state=active]:bg-card data-[state=active]:text-foreground " +
        "data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
        // Line variant
        "group-data-[variant=line]/tabs-list:rounded-none " +
        "group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent " +
        "after:absolute after:bottom-0 after:inset-x-2 after:h-[2px] after:rounded-full " +
        "after:bg-primary after:opacity-0 after:transition-opacity " +
        "group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
