# Backend API Changes

This document describes the backend changes for the Yukchi frontend. **All changes have been implemented in yukchi-backend.**

---

## 1. Courier Creation (POST /api/v1/couriers) — DONE

**Current error:** `{"success": false, "statusCode": 500, "message": "Internal server error", "path": "/api/v1/couriers"}`

**Frontend sends:**
```json
{
  "name": "string",
  "phone": "string",
  "password": "string",
  "avatarUrl": "string (base64 data URL, optional)"
}
```

**Implemented:**
- `password` added to CreateCourierDto (min 6 chars)
- Creates User (phone, passwordHash, name, role: courier) and Courier (same id) in transaction
- `avatarUrl` (base64) accepted and stored

---

## 2. Shop Creation (POST /api/v1/shops) — DONE

**Frontend now sends:**
```json
{
  "name": "string",
  "ownerName": "string",
  "phone": "string",
  "address": "string (optional)",
  "region": "string (optional, new)"
}
```

**Implemented:**
- `region` added to Shop model and CreateShopDto
- Migration: `prisma/migrations/20260225000000_add_shop_region/migration.sql`
- Run `npx prisma migrate deploy` to apply

---

## 3. Product Creation (POST /api/v1/products)

**Frontend sends:**
```json
{
  "tripId": "string",
  "name": "string",
  "quantity": "number",
  "costPrice": "string (total = quantity × pricePerUnit)",
  "imageUrl": "string (base64, optional)"
}
```

**Note:** Frontend computes `costPrice` as `quantity × pricePerUnit`. No API changes needed unless you want to store `unit` and `pricePerUnit` separately.

**Optional backend changes:**
- Add `unit` (шт, кг, м, etc.) and `pricePerUnit` fields if you want to store them

---

## 4. Trip Creation (POST /api/v1/trips) — DONE

**Frontend now sends:**
```json
{
  "name": "string",
  "departureDate": "string",
  "returnDate": "string",
  "budget": "string",
  "oldDebt": "string",
  "currency": "string",
  "regionId": "string (now Turkey city name or custom city)",
  "courierIds": "string[] (optional)"
}
```

**Implemented:**
- `regionId` accepts UUID or city name (e.g. "Стамбул", "Анкара")
- If city name: upserts Region by name, uses its id for Trip
- CreateTripDto.regionId: @IsString() @MaxLength(100)

---

## 5. Summary Checklist

- [x] `POST /couriers` — accept `password`, create User with role courier
- [x] `POST /couriers` — handle `avatarUrl` (base64)
- [x] `POST /shops` — accept `region` field
- [x] `POST /trips` — accept `regionId` as city name
- [x] Prisma schema — add `region` to Shop

**To apply migration:** `cd yukchi-backend/api && npx prisma migrate deploy`
