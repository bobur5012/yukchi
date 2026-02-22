"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getShops } from "@/lib/api/shops";
import type { Shop } from "@/types";
import { Button } from "@/components/ui/button";
import { MessageCircle, Store } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Активен",
  inactive: "Неактивен",
};

export function ShopsList() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShops(1, 100).then((r) => setShops(r.shops)).finally(() => setLoading(false));
  }, []);

  const filteredShops =
    filter === "overdue"
      ? shops.filter((s) => parseFloat(s.debt || "0") > 0)
      : shops;

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  return (
    <div className="space-y-4">
      {filteredShops.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <EmptyState
            icon={Store}
            title={filter === "overdue" ? "Нет просроченных долгов" : "Нет магазинов"}
            description={filter === "overdue" ? "Все долги в норме" : "Добавьте первый магазин"}
          />
        </div>
      ) : (
        <VirtualList
          items={filteredShops}
          estimateSize={110}
          gap={16}
          renderItem={(shop) => {
            const telegramUrl = shop.phone?.startsWith("+")
              ? `https://t.me/${shop.phone.replace(/\D/g, "")}`
              : null;
            return (
              <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-start gap-2 card-premium">
                <Link
                  href={`/shops/${shop.id}`}
                  className="min-w-0 flex-1"
                >
                  <h3 className="font-semibold text-lg truncate">
                    {shop.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{shop.ownerName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        statusColors[shop.status]
                      }`}
                    >
                      {statusLabels[shop.status]}
                    </span>
                    <span className="font-semibold text-lg">
                      {parseFloat(shop.debt || "0").toLocaleString()} UZS
                    </span>
                  </div>
                </Link>
                {telegramUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    asChild
                  >
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  </Button>
                )}
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
