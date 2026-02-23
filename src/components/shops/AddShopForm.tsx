"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { getPhoneDigits } from "@/lib/phone-utils";
import { useTranslations } from "@/lib/useTranslations";
import { createShop, addDebtEntry } from "@/lib/api/shops";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

export function AddShopForm() {
  const { t } = useTranslations();
  const router = useRouter();

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [initialDebt, setInitialDebt] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = getPhoneDigits(phone);
    const phoneNormalized = digits.length >= 12 ? `+${digits}` : undefined;
    if (!name.trim() || !ownerName.trim()) {
      toast.error(t("shops.fillNameAndOwner"));
      return;
    }
    if (!phoneNormalized) {
      toast.error(t("shops.fullPhoneRequired"));
      return;
    }
    try {
      const shop = await createShop({
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phoneNormalized,
        address: address.trim() || undefined,
      });
      const numDebt = parseFloat(initialDebt);
      if (!isNaN(numDebt) && numDebt > 0) {
        await addDebtEntry(shop.id, {
          amount: initialDebt,
          type: "debt",
          description: comment.trim() || undefined,
        });
      }
      toast.success(t("shops.added"));
      router.push("/shops");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormCard>
        <FormSection>
          <FormRow label={t("shops.shopName")}>
            <Input placeholder={t("shops.shopNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
          <FormRow label={t("shops.ownerName")}>
            <Input placeholder={t("shops.ownerNamePlaceholder")} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </FormRow>
          <FormRow label={t("shops.address")}>
            <Input placeholder={t("shops.addressPlaceholder")} value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormRow>
          <FormRow label={t("common.phone")}>
            <PhoneInput value={phone} onChange={setPhone} />
          </FormRow>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection title={t("shops.initialDebt")}>
          <FormRow label={t("common.amount")}>
            <Input
              type="number"
              placeholder="0"
              value={initialDebt}
              onChange={(e) => setInitialDebt(e.target.value)}
            />
          </FormRow>
          <FormRow label={t("common.comment")}>
            <Input placeholder={t("common.optional")} value={comment} onChange={(e) => setComment(e.target.value)} />
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full">{t("shops.add")}</Button>
    </form>
  );
}
