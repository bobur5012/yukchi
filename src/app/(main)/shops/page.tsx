"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ShopsList } from "@/components/shops/ShopsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ShopsReport = dynamic(
  () => import("@/components/shops/ShopsReport").then((m) => ({ default: m.ShopsReport })),
  { loading: () => <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" /> }
);

export default function ShopsPage() {
  return (
    <div className="space-y-4 pb-20">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-2xl">
          <TabsTrigger value="list">Список</TabsTrigger>
          <TabsTrigger value="report">Отчёт</TabsTrigger>
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
