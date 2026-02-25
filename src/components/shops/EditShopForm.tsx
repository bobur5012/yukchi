"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { getShop, updateShop } from "@/lib/api/shops";
import { getPhoneDigits } from "@/lib/phone-utils";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";
import { REGIONS } from "@/lib/constants";

const OTHER_VALUE = "Другое";

export function EditShopForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [regionOther, setRegionOther] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getShop(id)
      .then((s) => {
        setName(s.name);
        setOwnerName(s.ownerName);
        setAddress(s.address || "");
        const r = s.region || "";
        const inList = (REGIONS as readonly string[]).includes(r);
        setRegion(inList ? r : OTHER_VALUE);
        setRegionOther(inList ? "" : r);
        setPhone(s.phone);
        setStatus(s.status === "active" ? "active" : "inactive");
      })
      .catch(() => toast.error("Магазин не найден"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = getPhoneDigits(phone);
    const phoneNormalized = digits.length >= 12 ? `+${digits}` : undefined;
    const regionValue = region === OTHER_VALUE ? regionOther.trim() : region;

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
    if (!id) return;

    try {
      await updateShop(id, {
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phoneNormalized,
        address: address.trim() || undefined,
        region: regionValue || undefined,
        status,
      });
      toast.success("Магазин обновлён");
      router.push("/shops");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  if (loading) {
    return (
      <div className="pb-20 space-y-4">
        <div className="h-[100px] rounded-2xl bg-muted/50 animate-pulse" />
        <div className="h-[200px] rounded-2xl bg-muted/50 animate-pulse" />
      </div>
    );
  }

  const showRegionOther = region === OTHER_VALUE;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormCard>
        <FormSection>
          <FormRow label={t("shops.shopName")}>
            <Input
              placeholder={t("shops.shopNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormRow>
          <FormRow label={t("shops.ownerName")}>
            <Input
              placeholder={t("shops.ownerNamePlaceholder")}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </FormRow>
          <FormRow label={t("shops.address")}>
            <Input
              placeholder={t("common.optional")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormRow>
          <FormRow label="Регион">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder="Выберите регион" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_VALUE}>{OTHER_VALUE}</SelectItem>
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
          <FormRow label="Статус">
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="inactive">Неактивен</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full" disabled={!name.trim() || !ownerName.trim()}>
        Сохранить
      </Button>
    </form>
  );
}
