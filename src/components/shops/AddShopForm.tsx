"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPhoneDigits } from "@/lib/phone-utils";
import { useTranslations } from "@/lib/useTranslations";
import { createShop, addDebtEntry } from "@/lib/api/shops";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";
import { REGIONS } from "@/lib/constants";

const OTHER_VALUE = "Другое";

export function AddShopForm() {
  const { t } = useTranslations();
  const router = useRouter();

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [regionOther, setRegionOther] = useState("");
  const [phone, setPhone] = useState("");
  const [initialDebt, setInitialDebt] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = getPhoneDigits(phone);
    const phoneNormalized = digits.length >= 12 ? `+${digits}` : undefined;
    const regionValue = region === OTHER_VALUE ? regionOther.trim() : region;
    const numDebt = parseFloat(initialDebt);

    if (!name.trim()) {
      toast.error("Название магазина обязательно");
      return;
    }
    if (!ownerName.trim()) {
      toast.error("Имя владельца обязательно");
      return;
    }
    if (!phoneNormalized) {
      toast.error(t("shops.fullPhoneRequired"));
      return;
    }
    if (!regionValue) {
      toast.error("Регион обязателен");
      return;
    }
    if (isNaN(numDebt) || numDebt < 0) {
      toast.error("Начальный долг обязателен");
      return;
    }

    try {
      const shop = await createShop({
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phoneNormalized,
        address: address.trim() || undefined,
        region: regionValue,
      });
      await addDebtEntry(shop.id, {
        amount: initialDebt,
        type: "debt",
        description: comment.trim() || undefined,
      });
      toast.success(t("shops.added"));
      router.push("/shops");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const showRegionOther = region === OTHER_VALUE;

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
            <Input placeholder={t("common.optional")} value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormRow>
          <FormRow label="Регион">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder="Выберите регион" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showRegionOther && (
              <div className="mt-3">
                <Input
                  placeholder="Укажите регион"
                  value={regionOther}
                  onChange={(e) => setRegionOther(e.target.value)}
                  className="h-[44px] rounded-xl"
                />
              </div>
            )}
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
              min="0"
              value={initialDebt}
              onChange={(e) => setInitialDebt(e.target.value)}
            />
          </FormRow>
          <FormRow label={t("common.comment")}>
            <Input placeholder={t("common.optional")} value={comment} onChange={(e) => setComment(e.target.value)} />
          </FormRow>
        </FormSection>
      </FormCard>

      <Button
        type="submit"
        className="w-full"
        disabled={
          !name.trim() ||
          !ownerName.trim() ||
          !region ||
          (region === OTHER_VALUE && !regionOther.trim()) ||
          isNaN(parseFloat(initialDebt)) ||
          parseFloat(initialDebt) < 0
        }
      >
        {t("shops.add")}
      </Button>
    </form>
  );
}
