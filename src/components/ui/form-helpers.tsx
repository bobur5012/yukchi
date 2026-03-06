import * as React from "react";
import { cn } from "@/lib/utils";

/** Grouped card — white background, rounded, no heavy shadow */
export function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(30,30,36,0.96)_0%,rgba(22,22,28,0.92)_100%)] shadow-[0_20px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FormHero({
  icon,
  title,
  description,
  meta,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,rgba(94,92,230,0.18)_0%,rgba(24,24,30,0.96)_42%,rgba(14,14,18,0.98)_100%)] px-5 py-5 shadow-[0_24px_48px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-semibold tracking-[-0.05em] text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
    </div>
  );
}

export function FormMetaPill({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-[96px] rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2 backdrop-blur",
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[14px] font-semibold tracking-[-0.02em] text-foreground">{value}</p>
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
        <p className="px-5 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">
          {title}
        </p>
      )}
      <div className="divide-y divide-white/6">{children}</div>
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
    <div className={cn("px-5 py-4", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/90",
        className
      )}
    >
      {children}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-[12px] leading-5 text-muted-foreground">
      {children}
    </p>
  );
}
