"use client";

import { CouriersList } from "@/components/couriers/CouriersList";
import { CouriersReport } from "@/components/couriers/CouriersReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CouriersPage() {
  return (
    <div className="space-y-4 pb-20">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-2xl">
          <TabsTrigger value="list">Список</TabsTrigger>
          <TabsTrigger value="report">Отчёт</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <CouriersList />
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          <CouriersReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
