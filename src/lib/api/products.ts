import { api } from "./client";
import type { Product } from "@/types";

export async function getProducts(tripId: string): Promise<Product[]> {
  return api.get<Product[]>(`/products?tripId=${tripId}`);
}

export async function createProduct(data: {
  tripId: string;
  name: string;
  quantity: number;
  unit?: string;
  costPrice: string;
  salePrice?: string;
  pricePerKg?: string;
  imageUrl?: string;
}): Promise<Product> {
  return api.post<Product>("/products", data);
}
