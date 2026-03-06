import type { Product } from "@/types";

function toNum(value?: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getProductQuantityValue(quantity?: number | null): number {
  return quantity && quantity > 0 ? quantity : 0;
}

export function getProductDeliveryWeightValue(product: Pick<Product, "deliveryKg" | "quantity">): number {
  const deliveryKg = toNum(product.deliveryKg);
  if (deliveryKg > 0) return deliveryKg;
  return getProductQuantityValue(product.quantity);
}

export function getProductSaleUnitPrice(product: Pick<Product, "salePrice" | "salePriceUsd">): number {
  return toNum(product.salePrice ?? product.salePriceUsd);
}

export function getProductFixedDeliveryPrice(product: Pick<Product, "costPrice" | "costPriceUsd">): number {
  return toNum(product.costPrice ?? product.costPriceUsd);
}

export function getProductDeliveryPerKgPrice(product: Pick<Product, "pricePerKg" | "pricePerKgUsd">): number {
  return toNum(product.pricePerKg ?? product.pricePerKgUsd);
}

export function getProductTotalSale(product: Pick<Product, "quantity" | "salePrice" | "salePriceUsd">): number {
  const quantity = getProductQuantityValue(product.quantity);
  const salePrice = getProductSaleUnitPrice(product);
  return quantity > 0 && salePrice > 0 ? quantity * salePrice : 0;
}

export function getProductTotalDelivery(
  product: Pick<Product, "quantity" | "deliveryKg" | "pricePerKg" | "pricePerKgUsd" | "costPrice" | "costPriceUsd">
): number {
  const deliveryPerKg = getProductDeliveryPerKgPrice(product);
  if (deliveryPerKg > 0) {
    const deliveryWeight = getProductDeliveryWeightValue(product);
    return deliveryWeight > 0 ? deliveryWeight * deliveryPerKg : 0;
  }

  const fixedDelivery = getProductFixedDeliveryPrice(product);
  return fixedDelivery > 0 ? fixedDelivery : 0;
}
