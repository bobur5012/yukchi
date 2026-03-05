"use client";

import dynamic from "next/dynamic";
import { ProductsList } from "@/components/products/ProductsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/lib/useTranslations";

const ProductsReport = dynamic(
  () => import("@/components/products/ProductsReport").then((m) => ({ default: m.ProductsReport })),
  { loading: () => <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" /> }
);

export default function ProductsPage() {
  const { t } = useTranslations();
  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-border/30 bg-card/70 p-1">
          <TabsTrigger value="list">{t("tabs.list")}</TabsTrigger>
          <TabsTrigger value="report">{t("tabs.report")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <ProductsList />
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          <ProductsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
