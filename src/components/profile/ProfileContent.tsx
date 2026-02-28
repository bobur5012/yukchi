"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { getCourier, updateCourier } from "@/lib/api/couriers";
import type { Courier } from "@/types";
import { Pencil } from "lucide-react";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTranslations } from "@/lib/useTranslations";
import { useCurrencyStore } from "@/stores/currency";

function getInitials(name: string): string {
  const parts = name?.trim().split(/\s+/) ?? [];
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name?.slice(0, 2).toUpperCase() ?? "?";
}

export function ProfileContent() {
  const { t } = useTranslations();
  const user = useAuthStore((s) => s.user);
  const { locale, setLocale } = useLocale();
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const [courier, setCourier] = useState<Courier | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  useEffect(() => {
    if (user?.role === "courier" && user?.id) {
      getCourier(user.id).then(setCourier).catch(() => setCourier(null));
    }
  }, [user?.role, user?.id]);

  const displayName = courier?.name ?? user?.name ?? t("common.user");
  const avatarUrl   = courier?.avatarUrl;
  const roleLabel   = user?.role === "admin" ? t("common.admin") : t("common.courier");

  const handleSaveName = async () => {
    if (user?.role !== "courier" || !user?.id || !nameValue.trim()) return;
    try {
      await updateCourier(user.id, { name: nameValue.trim() });
      setCourier((c) => (c ? { ...c, name: nameValue.trim() } : null));
      setEditingName(false);
    } catch { setEditingName(false); }
  };

  return (
    <div className="space-y-4">
      {/* Profile hero */}
      <div className="bg-card rounded-2xl border border-border/30 p-6 flex flex-col items-center gap-3">
        <Avatar className="size-[76px]">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="text-[22px] font-semibold bg-primary/15 text-primary">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        {editingName && user?.role === "courier" ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="flex-1 max-w-[180px] text-center h-[44px] rounded-xl bg-muted border border-border px-3 text-[16px] outline-none focus:border-primary"
              autoFocus
            />
            <Button size="sm" onClick={handleSaveName} className="h-[44px]">{t("common.ok")}</Button>
            <Button size="sm" variant="ghost" className="h-[44px]" onClick={() => { setEditingName(false); setNameValue(displayName); }}>{t("common.cancel")}</Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <h2 className="text-[20px] font-semibold">{displayName}</h2>
            {user?.role === "courier" && (
              <button
                type="button"
                onClick={() => { setEditingName(true); setNameValue(displayName); }}
                className="size-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        <span className="text-[13px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {roleLabel}
        </span>
      </div>

      {/* Language */}
      <div className="bg-card rounded-2xl border border-border/30 px-4 py-3">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.07em] mb-3">{t("profile.language")}</p>
        <div className="flex gap-2">
          <Button variant={locale === "ru" ? "default" : "secondary"} className="flex-1 h-[44px] rounded-[13px] text-[15px]" onClick={() => setLocale("ru")}>
            🇷🇺 {t("profile.russian")}
          </Button>
          <Button variant={locale === "uz" ? "default" : "secondary"} className="flex-1 h-[44px] rounded-[13px] text-[15px]" onClick={() => setLocale("uz")}>
            🇺🇿 {t("profile.uzbek")}
          </Button>
        </div>
      </div>

      {/* Currency */}
      <div className="bg-card rounded-2xl border border-border/30 px-4 py-3">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.07em] mb-3">Валюта</p>
        <div className="flex gap-2">
          {(["USD", "UZS", "TRY"] as const).map((c) => (
            <Button
              key={c}
              variant={currency === c ? "default" : "secondary"}
              className="flex-1 h-[44px] rounded-[13px] text-[15px]"
              onClick={() => setCurrency(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <SettingsContent role={user?.role} />
    </div>
  );
}
