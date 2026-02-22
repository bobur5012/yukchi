"use client";

import * as React from "react";
import {
  formatPhoneUzSuffix,
  getFullPhoneFromSuffix,
  getPhoneDigits,
} from "@/lib/phone-utils";
import { cn } from "@/lib/utils";

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  inputSize?: "default" | "lg" | "xl";
}

const UzFlag = () => (
  <img
    src="https://flagcdn.com/w20/uz.png"
    alt=""
    width={18}
    height={13}
    className="shrink-0 rounded-[3px] object-cover"
    loading="eager"
  />
);

export function PhoneInput({ value, onChange, className, inputSize, ...props }: PhoneInputProps) {
  const digits = getPhoneDigits(value);
  const suffixDigits = digits.length >= 3 ? digits.slice(3) : "";
  const displaySuffix = formatPhoneUzSuffix(suffixDigits);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(getFullPhoneFromSuffix(e.target.value));
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-muted/50",
        "px-[14px] h-[44px]",
        "transition-[border-color,box-shadow] duration-150",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
        inputSize === "xl" && "h-[48px]",
        className
      )}
    >
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground text-[15px]">
        <UzFlag />
        <span className="font-medium tabular-nums text-foreground/70 text-[15px]">+998</span>
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={displaySuffix}
        onChange={handleChange}
        placeholder="(77) 777-77-77"
        className="min-w-0 flex-1 bg-transparent outline-none text-[16px] text-foreground placeholder:text-muted-foreground/60 h-full"
        autoComplete="tel"
        {...props}
      />
    </div>
  );
}
