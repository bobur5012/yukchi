"use client";

import { useState } from "react";
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
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { addExpense } from "@/lib/api/trips";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

const CUSTOM = "__custom__";

export default function AddExpensePage() {
  const router   = useRouter();
  const params   = useParams();
  const tripId   = params.id as string;

  const [category, setCategory]                 = useState("");
  const [customCategory, setCustomCategory]     = useState("");
  const [amount, setAmount]                     = useState("");
  const [loading, setLoading]                   = useState(false);

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
        currency: "USD",
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
          <FormRow label="Сумма (USD)">
            <Input type="number" step="0.01" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormRow>
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
