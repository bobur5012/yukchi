"use client";

import { TripsList } from "@/components/trips/TripsList";
import { TripsReport } from "@/components/trips/TripsReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TripsPage() {
  return (
    <div className="space-y-4 pb-20">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-2xl">
          <TabsTrigger value="list">Список</TabsTrigger>
          <TabsTrigger value="report">Отчёт</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <TripsList />
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          <TripsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
