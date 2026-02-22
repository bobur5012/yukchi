"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">Нет соединения</h2>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Проверьте подключение к интернету и попробуйте снова.
      </p>
      <Button onClick={() => window.location.reload()} className="rounded-xl">
        Повторить
      </Button>
    </div>
  );
}
