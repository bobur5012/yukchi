"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { createCourier } from "@/lib/api/couriers";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

export function AddCourierForm() {
  const router = useRouter();
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [avatar, setAvatar] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Заполните все поля"); return;
    }
    try {
      await createCourier({ name: name.trim(), phone, avatarUrl: avatar.trim() || undefined });
      toast.success("Курьер создан");
      router.push("/couriers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
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
          <FormRow label="Имя">
            <Input placeholder="Алексей" value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
          <FormRow label="Телефон">
            <PhoneInput value={phone} onChange={setPhone} />
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full">Создать</Button>
    </form>
  );
}
