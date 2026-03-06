const PRODUCT_UNIT_KEYS = {
  "шт": "products.units.piece",
  "кг": "products.units.kg",
  "грамм": "products.units.gram",
  "л": "products.units.liter",
  "м": "products.units.meter",
  "упаковка": "products.units.pack",
  "коробка": "products.units.box",
  "пачка": "products.units.packet",
} as const;

export const PRODUCT_UNIT_VALUES = Object.keys(PRODUCT_UNIT_KEYS) as Array<keyof typeof PRODUCT_UNIT_KEYS>;

export function normalizeProductUnit(unit?: string | null): keyof typeof PRODUCT_UNIT_KEYS | null {
  const normalized = unit?.trim().toLowerCase();
  if (!normalized) return null;
  return (normalized in PRODUCT_UNIT_KEYS ? normalized : null) as keyof typeof PRODUCT_UNIT_KEYS | null;
}

export function getLocalizedProductUnit(
  t: (key: string) => string,
  unit?: string | null,
  fallbackKey = "products.defaultUnit"
): string {
  const normalized = normalizeProductUnit(unit);
  if (!normalized) {
    return t(fallbackKey);
  }
  return t(PRODUCT_UNIT_KEYS[normalized]);
}

export function getProductUnitOptions(t: (key: string) => string) {
  return PRODUCT_UNIT_VALUES.map((value) => ({
    value,
    label: t(PRODUCT_UNIT_KEYS[value]),
  }));
}
