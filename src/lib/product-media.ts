import type { Product } from "@/types";
import { getAvatarUrl } from "@/lib/utils";

export function getProductImageUrls(product?: Pick<Product, "imageUrls" | "imageUrl"> | null): string[] {
  const urls = (product?.imageUrls ?? []).filter((value): value is string => Boolean(value));
  if (urls.length > 0) return urls;
  return product?.imageUrl ? [product.imageUrl] : [];
}

export function getProductResolvedImageUrls(
  product?: Pick<Product, "id" | "createdAt" | "imageUrls" | "imageUrl"> | null
): string[] {
  return getProductImageUrls(product).map((url, index) =>
    getAvatarUrl(url, `${product?.id ?? "product"}-${product?.createdAt ?? "1"}-${index}`) ?? url
  );
}

export function getProductCoverImageUrl(
  product?: Pick<Product, "id" | "createdAt" | "imageUrls" | "imageUrl"> | null
): string | undefined {
  return getProductResolvedImageUrls(product)[0];
}
