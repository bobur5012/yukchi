"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateSafe } from "@/lib/date-utils";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import { useTranslations } from "@/lib/useTranslations";
import type { Expense } from "@/types";

interface ExpenseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  tripCurrency: string;
}

export function ExpenseDetailSheet({
  open,
  onOpenChange,
  expense,
  tripCurrency,
}: ExpenseDetailSheetProps) {
  const { locale } = useTranslations();
  const { formatAmount } = useFormattedAmount();
  if (!expense) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Расход</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div>
            <p className="text-[13px] text-muted-foreground">Описание</p>
            <p className="text-[17px] font-semibold">{expense.description}</p>
          </div>
          <div>
            <p className="text-[13px] text-muted-foreground">Сумма</p>
            <p className="text-[20px] font-semibold tabular-nums tracking-[-0.03em]">
              {formatAmount(parseFloat(expense.amountUsd || expense.amount || "0"))}
            </p>
          </div>
          <div>
            <p className="text-[13px] text-muted-foreground">Дата</p>
            <p className="text-[15px] font-medium">{expense.createdAt ? formatDateSafe(expense.createdAt, "d MMMM yyyy", locale) : "—"}</p>
          </div>
          {expense.createdByUser && (
            <div>
              <p className="text-[13px] text-muted-foreground">Кто внёс</p>
              <p className="text-[15px] font-medium">{expense.createdByUser.name}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
