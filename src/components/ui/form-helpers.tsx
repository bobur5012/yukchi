import * as React from "react";
import { cn } from "@/lib/utils";

/** Grouped card — white background, rounded, no heavy shadow */
export function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border/30 overflow-hidden", className)}>
      {children}
    </div>
  );
}

/** Section inside FormCard — optional header + rows */
export function FormSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {title && (
        <p className="px-4 pt-4 pb-1 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">
          {title}
        </p>
      )}
      <div className="divide-y divide-border/30">{children}</div>
    </div>
  );
}

/** Single field row — label top, input below */
export function FormRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em]", className)}>
      {children}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-muted-foreground mt-1">{children}</p>;
}
