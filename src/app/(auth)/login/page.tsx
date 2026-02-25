"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showForm, setShowForm] = useState(false);

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
      {/* Logo section */}
      <motion.div
        className="flex flex-col items-center mb-8"
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative w-24 h-24 mb-5 rounded-2xl overflow-hidden bg-card shadow-xl shadow-primary/20 border border-border/40 flex items-center justify-center"
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img
            src="/icon.ico"
            alt="Yukchi"
            className="w-14 h-14 object-contain"
          />
        </motion.div>
        <motion.h1
          className="text-[22px] font-bold tracking-[-0.03em] text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {t("auth.loginTitle")}
        </motion.h1>
        <motion.p
          className="text-[15px] text-muted-foreground mt-1.5 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          {t("auth.loginSubtitle")}
        </motion.p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="entry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Button
              onClick={() => setShowForm(true)}
              className="w-full h-[52px] text-[16px] font-semibold rounded-[14px] shadow-lg shadow-primary/25"
            >
              {t("auth.login")}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
              <form id="login-form" onSubmit={handleSubmit}>
                <div className="px-4 pt-4 pb-3">
                  <label className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] block mb-1.5">
                    {t("auth.phone")}
                  </label>
                  <PhoneInput value={phone} onChange={setPhone} />
                </div>
                <div className="h-px bg-border/40 mx-4" />
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
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 h-[50px] rounded-[14px]"
              >
                {t("common.cancel")}
              </Button>
              <Button
                form="login-form"
                type="submit"
                className="flex-1 h-[50px] text-[16px] font-semibold rounded-[14px]"
                disabled={isLoading}
              >
                {isLoading ? t("auth.loggingIn") : t("auth.login")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
