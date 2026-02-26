"use client";

import dynamic from "next/dynamic";
import { TripsList } from "@/components/trips/TripsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TripsReport = dynamic(
  () => import("@/components/trips/TripsReport").then((m) => ({ default: m.TripsReport })),
  { loading: () => <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" /> }
);

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
