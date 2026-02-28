"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { createCourier } from "@/lib/api/couriers";
import { uploadAvatar } from "@/lib/api/storage";
import { getPhoneDigits } from "@/lib/phone-utils";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";
import { Eye, EyeOff } from "lucide-react";

export function AddCourierForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar]     = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error(t("common.fillAllFields")); return;
    }
    if (!password.trim() || password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов"); return;
    }
    setIsSubmitting(true);
    try {
      const digits = getPhoneDigits(phone);
      const phoneE164 = digits.length >= 12 ? `+${digits}` : phone;
      await createCourier({
        name: name.trim(),
        phone: phoneE164,
        password: password.trim(),
        avatarUrl: avatar.trim() || undefined,
      });
      toast.success(t("couriers.created"));
      router.push("/couriers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      {/* Avatar */}
      <div className="flex justify-center py-4">
        <AvatarPicker
          value={avatar || null}
          onChange={(v) => setAvatar(v ?? "")}
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
          <FormRow label="Пароль">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Сохранение…" : t("couriers.create")}
      </Button>
    </form>
  );
}
