"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import type { Courier } from "@/types";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const parts = name?.trim().split(/\s+/) ?? [];
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name?.slice(0, 2).toUpperCase() ?? "?";
}

interface CourierSelectListProps {
  couriers: Courier[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function CourierSelectList({ couriers, selectedIds, onToggle }: CourierSelectListProps) {
  if (couriers.length === 0) {
    return (
      <p className="text-[14px] text-muted-foreground text-center py-4">
        Нет доступных курьеров
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {couriers.map((c) => {
        const isSelected = selectedIds.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={cn(
              "flex items-center gap-3 w-full rounded-[13px] px-3 py-2.5 text-left",
              "transition-colors duration-100 -webkit-tap-highlight-color-transparent",
              isSelected
                ? "bg-primary/10"
                : "hover:bg-muted/50 active:bg-muted"
            )}
          >
            {/* Avatar — compact 34px */}
            <Avatar className="size-[34px] shrink-0">
              {c.avatarUrl ? <AvatarImage src={c.avatarUrl} alt={c.name} /> : null}
              <AvatarFallback className="text-[11px] font-semibold bg-muted text-muted-foreground">
                {getInitials(c.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <span className="flex-1 text-[15px] font-medium truncate">
              {c.name}
            </span>

            {/* Check indicator */}
            {isSelected ? (
              <div className="shrink-0 size-[22px] rounded-full bg-primary flex items-center justify-center">
                <Check className="size-3 text-white" strokeWidth={3} />
              </div>
            ) : (
              <div className="shrink-0 size-[22px] rounded-full border-2 border-muted" />
            )}
          </button>
        );
      })}
    </div>
  );
}
