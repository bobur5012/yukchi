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
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { getCourier, updateCourier } from "@/lib/api/couriers";
import { uploadAvatar } from "@/lib/api/storage";
import { getPhoneDigits } from "@/lib/phone-utils";
import { useTranslations } from "@/lib/useTranslations";
import type { Courier } from "@/types";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function EditCourierForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [avatar, setAvatar]   = useState("");
  const [status, setStatus]   = useState<"active" | "inactive">("active");

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getCourier(id)
      .then((c: Courier) => {
        setName(c.name); setPhone(c.phone);
        setAvatar(c.avatarUrl || "");
        setStatus(c.status === "active" ? "active" : "inactive");
      })
      .catch(() => toast.error(t("couriers.notFound")))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast.error(t("common.fillRequiredFields")); return; }
    if (!id) return;
    try {
      const digits = getPhoneDigits(phone);
      const phoneE164 = digits.length >= 12 ? `+${digits}` : phone;
      await updateCourier(id, {
        name: name.trim(), phone: phoneE164, status, avatarUrl: avatar.trim() || undefined,
      });
      toast.success(t("couriers.updated"));
      router.push("/couriers");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <div className="flex justify-center py-4">
        <AvatarPicker
          value={avatar || null}
          onChange={(v) => setAvatar(v ?? "")}
          placeholder={getInitials(name)}
          onUpload={async (f) => {
            try {
              return await uploadAvatar(f);
            } catch {
              toast.error("Ошибка загрузки изображения");
              throw new Error("Upload failed");
            }
          }}
        />
      </div>

      <FormCard>
        <FormSection>
          <FormRow label={t("common.name")}>
            <Input placeholder={t("couriers.placeholderName")} value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
          <FormRow label={t("common.phone")}>
            <PhoneInput value={phone} onChange={setPhone} />
          </FormRow>
          <FormRow label={t("couriers.status")}>
            <Select value={status} onValueChange={(v: "active" | "inactive") => setStatus(v)}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("couriers.active")}</SelectItem>
                <SelectItem value="inactive">{t("couriers.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full">{t("common.save")}</Button>
    </form>
  );
}
