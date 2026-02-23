"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { createCourier } from "@/lib/api/couriers";
import { getPhoneDigits } from "@/lib/phone-utils";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

export function AddCourierForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [avatar, setAvatar] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error(t("common.fillAllFields")); return;
    }
    try {
      const digits = getPhoneDigits(phone);
      const phoneE164 = digits.length >= 12 ? `+${digits}` : phone;
      await createCourier({ name: name.trim(), phone: phoneE164, avatarUrl: avatar.trim() || undefined });
      toast.success(t("couriers.created"));
      router.push("/couriers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      {/* Avatar */}
      <div className="flex justify-center py-4">
        <AvatarPicker value={avatar || null} onChange={(v) => setAvatar(v ?? "")} />
      </div>

      <FormCard>
        <FormSection>
          <FormRow label={t("common.name")}>
            <Input placeholder={t("couriers.placeholderName")} value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
          <FormRow label={t("common.phone")}>
            <PhoneInput value={phone} onChange={setPhone} />
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full">{t("couriers.create")}</Button>
    </form>
  );
}
