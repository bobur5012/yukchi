"use client";

import dynamic from "next/dynamic";
import { CouriersList } from "@/components/couriers/CouriersList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CouriersReport = dynamic(
  () => import("@/components/couriers/CouriersReport").then((m) => ({ default: m.CouriersReport })),
  { loading: () => <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" /> }
);

export default function CouriersPage() {
  return (
    <div className="space-y-4">
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
