import type { Product } from "@/types";

function toNum(value?: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getProductQuantityValue(quantity?: number | null): number {
  return quantity && quantity > 0 ? quantity : 0;
}

export function getProductDeliveryKgValues(product: Pick<Product, "deliveryKgValues">): number[] {
  return (product.deliveryKgValues ?? [])
    .map((value) => toNum(value))
    .filter((value) => value > 0);
}

export function getProductDeliveryWeightValue(
  product: Pick<Product, "deliveryKgValues" | "deliveryKg" | "quantity">
): number {
  const kgValuesTotal = getProductDeliveryKgValues(product).reduce((sum, value) => sum + value, 0);
  if (kgValuesTotal > 0) return kgValuesTotal;
  const deliveryKg = toNum(product.deliveryKg);
  if (deliveryKg > 0) return deliveryKg;
  return getProductQuantityValue(product.quantity);
}

export function getProductSalePrice(product: Pick<Product, "salePrice" | "salePriceUsd">): number {
  return toNum(product.salePrice ?? product.salePriceUsd);
}

export function getProductFixedDeliveryPrice(product: Pick<Product, "costPrice" | "costPriceUsd">): number {
  return toNum(product.costPrice ?? product.costPriceUsd);
}

export function getProductDeliveryPerKgPrice(product: Pick<Product, "pricePerKg" | "pricePerKgUsd">): number {
  return toNum(product.pricePerKg ?? product.pricePerKgUsd);
}

export function getProductTotalSale(product: Pick<Product, "quantity" | "salePrice" | "salePriceUsd">): number {
  return getProductSalePrice(product);
}

export const getProductSaleUnitPrice = getProductSalePrice;

export function getProductTotalDelivery(
  product: Pick<Product, "quantity" | "deliveryKgValues" | "deliveryKg" | "pricePerKg" | "pricePerKgUsd" | "costPrice" | "costPriceUsd">
): number {
  const deliveryPerKg = getProductDeliveryPerKgPrice(product);
  if (deliveryPerKg > 0) {
    const deliveryWeight = getProductDeliveryWeightValue(product);
    return deliveryWeight > 0 ? deliveryWeight * deliveryPerKg : 0;
  }

  const fixedDelivery = getProductFixedDeliveryPrice(product);
  return fixedDelivery > 0 ? fixedDelivery : 0;
}
