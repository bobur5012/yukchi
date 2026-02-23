"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { getPhoneDigits } from "@/lib/phone-utils";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";

export default function LoginPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { isAuthenticated, login, isLoading } = useAuthStore();
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) {
      toast.error(t("auth.fillAllFields"));
      return;
    }
    try {
      const digits = getPhoneDigits(phone);
      await login(digits.length >= 12 ? `+${digits}` : phone.trim(), password.trim());
      router.replace("/dashboard");
    } catch (err) {
      const e = err as Error & { code?: string };
      toast.error(e?.code === "INVALID_CREDENTIALS" ? t("auth.invalidCredentials") : (e?.message || t("auth.loginError")));
    }
  };

  return (
    <div className="w-full max-w-[360px] px-2">
      {/* App wordmark */}
      <div className="text-center mb-8">
        <p className="text-[13px] font-semibold text-primary tracking-[0.1em] uppercase mb-1">
          Yukchi
        </p>
        <h1 className="text-[22px] font-bold tracking-[-0.03em]">{t("auth.loginTitle")}</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      {/* Form card */}
      <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
        <form id="login-form" onSubmit={handleSubmit}>
          {/* Phone */}
          <div className="px-4 pt-4 pb-3">
            <label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] block mb-1.5">
              {t("auth.phone")}
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          {/* Separator */}
          <div className="h-px bg-border/40 mx-4" />

          {/* Password */}
          <div className="px-4 pt-3 pb-4">
            <label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] block mb-1.5">
              {t("auth.password")}
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </form>
      </div>

      {/* CTA */}
      <Button
        form="login-form"
        type="submit"
        className="w-full mt-4 h-[50px] text-[16px] font-semibold rounded-[14px]"
        disabled={isLoading}
      >
        {isLoading ? t("auth.loggingIn") : t("auth.login")}
      </Button>

      {/* Dev hint */}
      <p className="text-[12px] text-muted-foreground/50 text-center mt-5 leading-relaxed">
        +998 (90) 123-45-67 / admin<br />+998 (90) 123-45-68 / courier
      </p>
    </div>
  );
}
