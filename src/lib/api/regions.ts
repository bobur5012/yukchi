import { api } from "./client";
import type { Region } from "@/types";

export async function getRegions(): Promise<Region[]> {
  return api.get<Region[]>("/regions");
}
