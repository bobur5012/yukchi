"use client";

import { ProductsList } from "@/components/products/ProductsList";
import { ProductsReport } from "@/components/products/ProductsReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductsPage() {
  return (
    <div className="space-y-4 pb-20">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-2xl">
          <TabsTrigger value="list">Список</TabsTrigger>
          <TabsTrigger value="report">Отчёт</TabsTrigger>
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
