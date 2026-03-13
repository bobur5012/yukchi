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
import { createShop } from "@/lib/api/shops";
import { toast } from "sonner";
import {
  FormCard,
  FormRow,
  FormSection,
  FormHero,
  FormMetaPill,
} from "@/components/ui/form-helpers";
import { Store, MapPin, Wallet } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = getPhoneDigits(phone);
    const phoneNormalized = digits.length >= 12 ? `+${digits}` : undefined;
    const regionValue = region === OTHER_VALUE ? regionOther.trim() : region;
    const numDebt = initialDebt.trim() ? parseFloat(initialDebt) : 0;

    if (!name.trim()) {
      toast.error(t("shops.nameRequired"));
      return;
    }
    if (!ownerName.trim()) {
      toast.error(t("shops.ownerRequired"));
      return;
    }
    if (!phoneNormalized) {
      toast.error(t("shops.fullPhoneRequired"));
      return;
    }
    if (!regionValue) {
      toast.error(t("shops.regionRequired"));
      return;
    }
    if (isNaN(numDebt) || numDebt < 0) {
      toast.error(t("shops.initialDebtRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await createShop({
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phoneNormalized,
        address: address.trim() || undefined,
        region: regionValue,
        initialDebt: numDebt.toFixed(2),
        initialDebtComment: comment.trim() || undefined,
      });
      toast.success(t("shops.added"));
      router.push("/shops");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showRegionOther = region === OTHER_VALUE;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormHero
        icon={<Store className="size-5" />}
        title={t("shops.add")}
        description={t("shops.formHeroDescription")}
        meta={
          <>
            <FormMetaPill label={t("shops.shopName")} value={name.trim() || "—"} />
            <FormMetaPill label={t("shops.regionLabel")} value={(region === OTHER_VALUE ? regionOther : region) || "—"} />
            <FormMetaPill label={t("shops.initialDebt")} value={initialDebt ? `${initialDebt} $` : "0 $"} />
          </>
        }
      />

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
          <FormRow label={t("shops.regionLabel")}>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder={t("shops.selectRegion")} />
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
                  placeholder={t("shops.specifyRegion")}
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
          <FormRow label={t("common.amountUsd")}>
            <Input
              type="number"
              step="0.01"
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

      <FormCard className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{t("shops.summaryContact")}</p>
            <p className="mt-1 text-[14px] font-semibold tracking-[-0.03em]">{phone || "—"}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{t("shops.summaryLocation")}</p>
            <p className="mt-1 text-[14px] font-semibold tracking-[-0.03em]">
              {(region === OTHER_VALUE ? regionOther : region) || "—"}
            </p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{t("shops.summaryStart")}</p>
            <p className="mt-1 text-[14px] font-semibold tracking-[-0.03em]">{initialDebt || "0"} $</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground">
          <MapPin className="size-4 text-primary" />
          <Wallet className="size-4 text-primary" />
          {t("shops.createHint")}
        </div>
      </FormCard>

      <Button
        type="submit"
        className="h-12 w-full rounded-[22px]"
        disabled={
          isSubmitting ||
          !name.trim() ||
          !ownerName.trim() ||
          !region ||
          (region === OTHER_VALUE && !regionOther.trim()) ||
          (initialDebt.trim() !== "" && (isNaN(parseFloat(initialDebt)) || parseFloat(initialDebt) < 0))
        }
      >
        {isSubmitting ? t("common.saving") : t("shops.add")}
      </Button>
    </form>
  );
}
