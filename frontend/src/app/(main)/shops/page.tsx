"use client";

import { Suspense } from "react";
import { ShopsList } from "@/components/shops/ShopsList";
import { ShopsReport } from "@/components/shops/ShopsReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
