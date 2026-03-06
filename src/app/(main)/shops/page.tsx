"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ShopsList } from "@/components/shops/ShopsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/lib/useTranslations";

const ShopsReport = dynamic(
  () => import("@/components/shops/ShopsReport").then((m) => ({ default: m.ShopsReport })),
  { loading: () => <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" /> }
);

export default function ShopsPage() {
  const { t } = useTranslations();
  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-[24px] border border-white/8 bg-white/[0.04] p-1">
          <TabsTrigger value="list">{t("tabs.list")}</TabsTrigger>
          <TabsTrigger value="report">{t("tabs.report")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <Suspense fallback={<div className="animate-pulse h-32 rounded-2xl bg-muted" />}>
            <ShopsList />
          </Suspense>
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          <ShopsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
