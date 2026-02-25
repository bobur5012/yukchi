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
import type { Payment } from "@/types";

interface PaymentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  currency: string;
}

export function PaymentDetailSheet({
  open,
  onOpenChange,
  payment,
  currency,
}: PaymentDetailSheetProps) {
  const { locale } = useTranslations();
  const { formatAmountFromUzs } = useFormattedAmount();
  if (!payment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Платёж</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div>
            <p className="text-[13px] text-muted-foreground">Сумма</p>
            <p className="text-[20px] font-semibold tabular-nums tracking-[-0.03em]">
              {formatAmountFromUzs(Math.abs(parseFloat(payment.amount || "0")))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Дата</p>
            <p className="font-medium">{formatDateSafe(payment.date, "d MMMM yyyy", locale)}</p>
          </div>
          {payment.comment && (
            <div>
              <p className="text-sm text-muted-foreground">Комментарий</p>
              <p className="font-medium">{payment.comment}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
