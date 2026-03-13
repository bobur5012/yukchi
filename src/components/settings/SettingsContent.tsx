"use client";

import { useRouter } from "next/navigation";
import { Bell, BellOff, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/useTranslations";
import { useAuthStore } from "@/stores/auth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { sendTestPush } from "@/lib/api/push";

interface SettingsContentProps {
  role?: "admin" | "courier";
  hideNotifications?: boolean;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/30 bg-card">
      <div className="px-4 pb-1 pt-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">{title}</p>
      </div>
      <div className="space-y-3 px-4 pb-4 pt-2">{children}</div>
    </div>
  );
}

export function SettingsContent({ hideNotifications = false }: SettingsContentProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const push = usePushNotifications();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleEnablePush = async () => {
    const ok = await push.subscribe();
    if (ok) toast.success(t("push.enabled"));
    else if (push.permission === "denied") toast.error(t("push.permissionDenied"));
    else toast.error(t("push.error"));
  };

  const handleDisablePush = async () => {
    const ok = await push.unsubscribe();
    if (ok) toast.success(t("push.disabled"));
    else toast.error(t("push.error"));
  };

  const handleSendTestPush = async () => {
    try {
      await sendTestPush();
      toast.success(t("push.testSent"));
    } catch {
      toast.error(t("push.error"));
    }
  };

  return (
    <div className="space-y-4">
      {!hideNotifications ? (
        <SectionCard title={t("settings.notifications")}>
          {push.isSupported ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[16px]">{t("push.title")}</span>
                <div className="flex gap-2">
                  {push.isSubscribed ? (
                    <>
                      <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={handleSendTestPush}>
                        {t("push.sendTest")}
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={handleDisablePush} disabled={push.loading}>
                        <BellOff className="mr-1 size-4" />
                        {t("push.disable")}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={handleEnablePush} disabled={push.loading}>
                      <Bell className="mr-1 size-4" />
                      {t("push.enable")}
                    </Button>
                  )}
                </div>
              </div>
              {push.permission === "denied" ? (
                <p className="text-[13px] text-muted-foreground">{t("push.permissionDenied")}</p>
              ) : null}
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">{t("push.unsupported")}</p>
          )}
        </SectionCard>
      ) : null}

      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <Button
          variant="ghost"
          className="h-[44px] w-full rounded-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 size-4" />
          {t("settings.logout")}
        </Button>
      </div>
    </div>
  );
}
