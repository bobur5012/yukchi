"use client";

import { useEffect, useState } from "react";
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
import { getAvatarUrl } from "@/lib/utils";

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
  const avatarUrl = getAvatarUrl(courier?.avatarUrl, courier?.id ?? user?.id);
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
      <div className="overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(28,28,34,0.98)_0%,rgba(19,19,24,0.92)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
            <Avatar className="relative size-[96px] border-4 border-white/8 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/18 text-[28px] font-semibold text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {editingName && user?.role === "courier" ? (
            <div className="flex w-full max-w-[260px] gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="h-[44px] max-w-[180px] flex-1 rounded-xl border border-border bg-muted px-3 text-center text-[16px] outline-none focus:border-primary"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName} className="h-[44px]">{t("common.ok")}</Button>
              <Button size="sm" variant="ghost" className="h-[44px]" onClick={() => { setEditingName(false); setNameValue(displayName); }}>{t("common.cancel")}</Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h2 className="text-[24px] font-semibold tracking-[-0.03em]">{displayName}</h2>
              {user?.role === "courier" && (
                <button
                  type="button"
                  onClick={() => { setEditingName(true); setNameValue(displayName); }}
                  className="flex size-8 items-center justify-center rounded-xl bg-white/[0.04] transition-colors hover:bg-white/[0.08]"
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[13px] text-muted-foreground">
            {roleLabel}
          </span>
        </div>
      </div>

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

      <div className="bg-card rounded-2xl border border-border/30 px-4 py-3">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.07em] mb-3">{t("profile.currency")}</p>
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

      <SettingsContent role={user?.role} hideNotifications />
    </div>
  );
}
