"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTranslations } from "@/lib/useTranslations";
import { useCurrencyStore } from "@/stores/currency";
import { getAvatarUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  type UserProfile,
} from "@/lib/api/users";
import { uploadAvatar } from "@/lib/api/storage";
import {
  clearLocalDraft,
  readLocalDraft,
  writeLocalDraft,
} from "@/lib/local-draft";

function getInitials(name: string): string {
  const parts = name?.trim().split(/\s+/) ?? [];
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name?.slice(0, 2).toUpperCase() ?? "?";
}

export function ProfileContent() {
  const { t } = useTranslations();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { locale, setLocale } = useLocale();
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [avatarValue, setAvatarValue] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const draftKey = user?.id ? `profile:${user.id}` : null;

  useEffect(() => {
    let active = true;

    if (!user?.id || !draftKey) {
      setLoading(false);
      return;
    }

    getCurrentUserProfile()
      .then((data) => {
        if (!active) return;

        const savedDraft = readLocalDraft<{ name?: string; avatarUrl?: string | null }>(
          draftKey
        );
        const nextName = savedDraft?.name ?? data.name ?? "";
        const nextAvatar = savedDraft?.avatarUrl ?? data.avatarUrl ?? null;

        setProfile(data);
        setNameValue(nextName);
        setAvatarValue(nextAvatar);
        updateUser({
          name: data.name,
          phone: data.phone,
          avatarUrl: data.avatarUrl ?? null,
        });
        setDraftRestored(Boolean(savedDraft));
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
      })
      .finally(() => {
        if (!active) return;
        setDraftReady(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [draftKey, updateUser, user?.id]);

  useEffect(() => {
    if (!draftReady || !draftKey) return;

    const normalizedName = nameValue.trim();
    const normalizedAvatar = avatarValue ?? null;
    const profileName = profile?.name?.trim() ?? "";
    const profileAvatar = profile?.avatarUrl ?? null;

    if (normalizedName === profileName && normalizedAvatar === profileAvatar) {
      clearLocalDraft(draftKey);
      return;
    }

    writeLocalDraft(draftKey, {
      name: normalizedName,
      avatarUrl: normalizedAvatar,
    });
  }, [avatarValue, draftKey, draftReady, nameValue, profile]);

  const displayName = nameValue.trim() || profile?.name || user?.name || t("common.user");
  const avatarUrl = getAvatarUrl(avatarValue ?? profile?.avatarUrl ?? null, user?.id);
  const roleLabel = user?.role === "admin" ? t("common.admin") : t("common.courier");

  const isProfileDirty = useMemo(() => {
    if (!profile) return false;
    return (
      nameValue.trim() !== (profile.name?.trim() ?? "") ||
      (avatarValue ?? null) !== (profile.avatarUrl ?? null)
    );
  }, [avatarValue, nameValue, profile]);

  const handleSaveProfile = async () => {
    if (!profile || !nameValue.trim()) return;

    setSavingProfile(true);
    try {
      const updated = await updateCurrentUserProfile({
        name: nameValue.trim(),
        ...(user?.role === "courier" ? { avatarUrl: avatarValue ?? null } : {}),
      });

      setProfile(updated);
      setNameValue(updated.name ?? "");
      setAvatarValue(updated.avatarUrl ?? null);
      updateUser({
        name: updated.name,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl ?? null,
      });
      if (draftKey) clearLocalDraft(draftKey);
      setDraftRestored(false);
      toast.success(t("profile.profileSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error(t("common.fillRequiredFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }

    setSavingPassword(true);
    try {
      await updateCurrentUserProfile({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("profile.passwordSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[180px] rounded-[30px] bg-muted/40 animate-pulse" />
        <div className="h-[140px] rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-[180px] rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(28,28,34,0.98)_0%,rgba(19,19,24,0.92)_100%)] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col items-center gap-3 text-center">
          {user?.role === "courier" ? (
            <AvatarPicker
              value={avatarValue}
              onChange={setAvatarValue}
              placeholder={getInitials(displayName)}
              onUpload={async (file) => uploadAvatar(file)}
              className="w-full"
            />
          ) : (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
              <Avatar className="relative size-[96px] border-4 border-white/8 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                <AvatarFallback className="bg-primary/18 text-[28px] font-semibold text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          <div className="w-full max-w-[320px] space-y-2">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-center text-[16px]"
              placeholder={t("common.name")}
            />
            {profile?.phone ? (
              <p className="text-[13px] text-muted-foreground">{profile.phone}</p>
            ) : null}
          </div>

          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[13px] text-muted-foreground">
            {roleLabel}
          </span>

          {draftRestored ? (
            <p className="text-[12px] text-muted-foreground">{t("profile.draftRestored")}</p>
          ) : null}

          <Button
            type="button"
            onClick={handleSaveProfile}
            disabled={!isProfileDirty || savingProfile || !nameValue.trim()}
            className="h-11 min-w-[180px] rounded-full px-5"
          >
            {savingProfile ? t("profile.savingProfile") : t("profile.saveProfile")}
          </Button>
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

      <div className="bg-card rounded-2xl border border-border/30 px-4 py-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
          {t("profile.passwordTitle")}
        </p>
        <div className="space-y-3">
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("profile.currentPassword")}
            className="h-11 rounded-2xl"
          />
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("profile.newPassword")}
            className="h-11 rounded-2xl"
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("profile.confirmPassword")}
            className="h-11 rounded-2xl"
          />
          <p className="text-[12px] text-muted-foreground">{t("profile.passwordHint")}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSavePassword}
            disabled={savingPassword}
            className="h-11 w-full rounded-2xl"
          >
            {savingPassword ? t("profile.savingPassword") : t("profile.savePassword")}
          </Button>
        </div>
      </div>

      {user?.role === "admin" ? (
        <Link
          href="/telegram"
          className="flex items-start gap-3 rounded-2xl border border-border/30 bg-card px-4 py-4 transition-colors hover:bg-card/80"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquareText className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">{t("profile.telegramWorkspace")}</p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{t("profile.telegramWorkspaceHint")}</p>
          </div>
        </Link>
      ) : null}

      <SettingsContent role={user?.role} hideNotifications />
    </div>
  );
}
