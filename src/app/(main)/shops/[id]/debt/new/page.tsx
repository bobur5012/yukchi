"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDebtEntry } from "@/lib/api/shops";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

export default function AddDebtPage() {
  const router = useRouter();
  const { id: shopId } = useParams<{ id: string }>();

  const [amount, setAmount]   = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { toast.error("Введите сумму"); return; }
    setLoading(true);
    try {
      await addDebtEntry(shopId, { amount, type: "debt", description: comment || undefined });
      toast.success("Долг добавлен");
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      <FormCard>
        <FormSection>
          <FormRow label="Сумма (USD)">
            <Input type="number" step="0.01" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormRow>
          <FormRow label="Комментарий">
            <Input placeholder="Опционально" value={comment} onChange={(e) => setComment(e.target.value)} />
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full" disabled={!amount || parseFloat(amount) <= 0 || loading}>
        {loading ? "Сохранение…" : "Добавить"}
      </Button>
      <Button type="button" variant="ghost" asChild className="w-full h-[44px] rounded-[14px]">
        <Link href={`/shops/${shopId}`}>Отмена</Link>
      </Button>
    </form>
  );
}
