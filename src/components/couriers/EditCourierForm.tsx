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
import type { Courier } from "@/types";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function EditCourierForm() {
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
      .catch(() => toast.error("Курьер не найден"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast.error("Заполните обязательные поля"); return; }
    if (!id) return;
    try {
      await updateCourier(id, {
        name: name.trim(), phone, status, avatarUrl: avatar.trim() || undefined,
      });
      toast.success("Курьер обновлён");
      router.push("/couriers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
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
        />
      </div>

      <FormCard>
        <FormSection>
          <FormRow label="Имя">
            <Input placeholder="Алексей" value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
          <FormRow label="Телефон">
            <PhoneInput value={phone} onChange={setPhone} />
          </FormRow>
          <FormRow label="Статус">
            <Select value={status} onValueChange={(v: "active" | "inactive") => setStatus(v)}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="inactive">Неактивен</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full">Сохранить</Button>
    </form>
  );
}
