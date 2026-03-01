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
  costPrice?: string;
  salePrice?: string;
  pricePerKg?: string;
  imageUrl?: string;
  description?: string;
  shopId?: string;
}): Promise<Product> {
  return api.post<Product>("/products", data);
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    quantity: number;
    unit: string;
    costPrice: string;
    salePrice: string;
    pricePerKg: string;
    imageUrl: string;
    description?: string;
    shopId: string | null;
  }>
): Promise<Product> {
  return api.patch<Product>(`/products/${id}`, data);
}

export async function getProduct(id: string): Promise<Product> {
  return api.get<Product>(`/products/${id}`);
}

export async function deleteProduct(id: string): Promise<void> {
  return api.delete(`/products/${id}`);
}
