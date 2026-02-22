"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES, CURRENCIES } from "@/lib/constants";
import { getTrip, addExpense } from "@/lib/api/trips";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

const CUSTOM = "__custom__";

export default function AddExpensePage() {
  const router   = useRouter();
  const params   = useParams();
  const tripId   = params.id as string;
  const userName = useAuthStore((s) => s.user?.name);

  const [tripCurrency, setTripCurrency]         = useState("");
  const [expenseCurrency, setExpenseCurrency]   = useState("");
  const [category, setCategory]                 = useState("");
  const [customCategory, setCustomCategory]     = useState("");
  const [amount, setAmount]                     = useState("");
  const [loading, setLoading]                   = useState(false);

  useEffect(() => {
    getTrip(tripId).then((t) => { setTripCurrency(t.currency); setExpenseCurrency(t.currency); });
  }, [tripId]);

  const resolvedCategory = category === CUSTOM ? customCategory.trim() : category;
  const isValid = resolvedCategory && amount && parseFloat(amount) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!resolvedCategory || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Заполните категорию и сумму"); return;
    }
    setLoading(true);
    try {
      await addExpense(tripId, {
        description: resolvedCategory,
        amount: amount,
        currency: expenseCurrency || tripCurrency,
      });
      toast.success("Расход добавлен");
      router.back();
    } catch {
      toast.error("Не удалось добавить расход");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      <FormCard>
        <FormSection>
          <FormRow label="Категория">
            <Select value={category} onValueChange={(v) => { setCategory(v); if (v !== CUSTOM) setCustomCategory(""); }}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                <SelectItem value={CUSTOM}>Своя категория</SelectItem>
              </SelectContent>
            </Select>
            {category === CUSTOM && (
              <Input
                placeholder="Название категории"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2 animate-in fade-in duration-200"
              />
            )}
          </FormRow>
          <div className="px-4 py-3 flex gap-3">
            <div className="flex-1">
              <label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] block mb-1.5">Сумма</label>
              <Input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="w-24">
              <label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] block mb-1.5">Валюта</label>
              <Select value={expenseCurrency} onValueChange={setExpenseCurrency}>
                <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full" disabled={!isValid || loading}>
        {loading ? "Сохранение…" : "Добавить"}
      </Button>
      <Button type="button" variant="ghost" asChild className="w-full h-[44px] rounded-[14px]">
        <Link href={`/trips/${tripId}`}>Отмена</Link>
      </Button>
    </form>
  );
}
