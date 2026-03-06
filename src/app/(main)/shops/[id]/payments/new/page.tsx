"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDebtEntry } from "@/lib/api/shops";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";
import { useTranslations } from "@/lib/useTranslations";
import { clearLocalDraft, readLocalDraft, writeLocalDraft } from "@/lib/local-draft";

export default function AddPaymentPage() {
  const router = useRouter();
  const { id: shopId } = useParams<{ id: string }>();
  const { t } = useTranslations();

  const [amount, setAmount]   = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const draftKey = `shop-payment:${shopId}`;

  useEffect(() => {
    const draft = readLocalDraft<{ amount: string; comment: string }>(draftKey);
    if (!draft) return;
    setAmount(draft.amount);
    setComment(draft.comment);
  }, [draftKey]);

  useEffect(() => {
    writeLocalDraft(draftKey, { amount, comment });
  }, [amount, comment, draftKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { toast.error(t("shops.enterAmount")); return; }
    setLoading(true);
    try {
      await addDebtEntry(shopId, { amount, type: "payment", description: comment || undefined });
      clearLocalDraft(draftKey);
      toast.success(t("shops.paymentAdded"));
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      <FormCard>
        <FormSection>
          <FormRow label={t("common.amountUsd")}>
            <Input type="number" step="0.01" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormRow>
          <FormRow label={t("common.comment")}>
            <Input placeholder={t("common.optional")} value={comment} onChange={(e) => setComment(e.target.value)} />
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full" disabled={!amount || parseFloat(amount) <= 0 || loading}>
        {loading ? t("common.saving") : t("common.add")}
      </Button>
      <Button type="button" variant="ghost" asChild className="w-full h-[44px] rounded-[14px]">
        <Link href={`/shops/${shopId}`}>{t("common.cancel")}</Link>
      </Button>
    </form>
  );
}
