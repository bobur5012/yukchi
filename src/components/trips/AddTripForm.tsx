"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrip } from "@/lib/api/trips";
import { getCouriers } from "@/lib/api/couriers";
import { TURKEY_CITIES } from "@/lib/constants";
import { CourierSelectList } from "@/components/couriers/CourierSelectList";
import { useTranslations } from "@/lib/useTranslations";
import { getLocalDateInputValue } from "@/lib/date-utils";
import type { Courier } from "@/types";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection, FieldHint } from "@/components/ui/form-helpers";
import { cn } from "@/lib/utils";
import { Plane, Calendar, Banknote, CreditCard } from "lucide-react";

const OTHER_VALUE = "Другое";
type FundingMode = "cash" | "debt";

type FieldErrors = {
  name?: boolean;
  dateReturn?: boolean;
  region?: boolean;
  budget?: boolean;
  debtAmount?: boolean;
};

export function AddTripForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const today = getLocalDateInputValue();

  const [name, setName] = useState("");
  const [dateDeparture, setDateDeparture] = useState(today);
  const [dateReturn, setDateReturn] = useState(today);
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [courierIds, setCourierIds] = useState<string[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [fundingMode, setFundingMode] = useState<FundingMode>("cash");
  const [debtAmount, setDebtAmount] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const resetForm = useCallback(() => {
    const currentDay = getLocalDateInputValue();
    setName("");
    setDateDeparture(currentDay);
    setDateReturn(currentDay);
    setBudget("");
    setCity("");
    setCityOther("");
    setCourierIds([]);
    setFundingMode("cash");
    setDebtAmount("0");
    setFieldErrors({});
  }, []);

  useEffect(() => {
    getCouriers().then(setCouriers);
  }, []);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        resetForm();
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [resetForm]);

  useEffect(() => {
    if (fundingMode === "cash") {
      setDebtAmount("0");
    } else if (fundingMode === "debt" && (!debtAmount || debtAmount === "0") && budget) {
      setDebtAmount(budget);
    }
  }, [fundingMode, budget, debtAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const numBudget = Number.parseFloat(budget.replace(/\s/g, ""));
    const regionId = city === OTHER_VALUE ? cityOther.trim() : city;
    const numDebt = fundingMode === "debt" ? Number.parseFloat(debtAmount.replace(/\s/g, "")) : 0;

    const errors: FieldErrors = {};

    if (!name.trim()) errors.name = true;
    if (dateReturn && dateDeparture && dateReturn < dateDeparture) errors.dateReturn = true;
    if (!regionId) errors.region = true;
    if (Number.isNaN(numBudget) || numBudget <= 0) errors.budget = true;
    if (fundingMode === "debt" && (Number.isNaN(numDebt) || numDebt <= 0)) errors.debtAmount = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) toast.error(t("common.fillAllFields"));
      else if (errors.dateReturn) toast.error(t("trips.returnBeforeDeparture"));
      else if (errors.region) toast.error("Укажите регион или город");
      else if (errors.budget) toast.error("Введите корректный бюджет (больше 0)");
      else if (errors.debtAmount) toast.error("Укажите сумму долга");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrip({
        name: name.trim(),
        departureDate: dateDeparture,
        returnDate: dateReturn,
        budget: String(numBudget),
        oldDebt: fundingMode === "debt" ? numDebt.toFixed(2) : "0",
        currency: "USD",
        regionId,
        courierIds: courierIds.length > 0 ? courierIds : undefined,
      });
      toast.success(t("trips.created"));
      router.push("/trips");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationDays =
    dateDeparture && dateReturn && dateReturn >= dateDeparture
      ? Math.ceil((new Date(dateReturn).getTime() - new Date(dateDeparture).getTime()) / 86400000) + 1
      : 0;

  const toggleCourier = (id: string) =>
    setCourierIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const showCityOther = city === OTHER_VALUE;
  const showDebtInput = fundingMode === "debt";
  const fieldClass = "w-full h-[44px] text-[14px] rounded-xl";
  const selectClass = "w-full h-[44px] rounded-xl border-border bg-muted/50 text-[14px]";
  const inputErrorClass = "border-destructive/70 focus-visible:ring-destructive/50";

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[360px] px-3 sm:px-0 space-y-5 pb-24">
      <FormCard className="overflow-hidden shadow-[0_10px_24px_-18px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_24px_-18px_rgba(0,0,0,0.6)]">
        <div className="px-4 pt-5 pb-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Plane className="h-4 w-4 text-primary" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em]">{t("trips.name")}</span>
          </div>
          <Input
            placeholder={t("trips.namePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: false }));
            }}
            className={cn(fieldClass, "mt-1.5", fieldErrors.name && inputErrorClass)}
          />
        </div>

        <FormSection title={t("trips.dates")} className="px-4 pb-4 space-y-3">
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">{t("trips.departureDate")}</span>
              </div>
              <Input
                type="date"
                value={dateDeparture}
                onChange={(e) => setDateDeparture(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">{t("trips.returnDate")}</span>
              </div>
              <Input
                type="date"
                value={dateReturn}
                onChange={(e) => {
                  setDateReturn(e.target.value);
                  if (fieldErrors.dateReturn) setFieldErrors((p) => ({ ...p, dateReturn: false }));
                }}
                min={dateDeparture}
                className={cn(fieldClass, fieldErrors.dateReturn && inputErrorClass)}
              />
            </div>
          </div>
          {durationDays > 0 && (
            <FieldHint>
              {durationDays} {durationDays === 1 ? t("trips.day") : durationDays < 5 ? t("trips.daysFew") : t("trips.daysMany")}
            </FieldHint>
          )}
        </FormSection>

        <FormSection title={t("trips.region")} className="px-4 pb-4 space-y-3">
          <Select value={city} onValueChange={(v) => { setCity(v); if (fieldErrors.region) setFieldErrors((p) => ({ ...p, region: false })); }}>
            <SelectTrigger className={cn(selectClass, fieldErrors.region && "border-destructive/70")}>
              <SelectValue placeholder={t("trips.selectRegion")} />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[100]">
              {TURKEY_CITIES.filter((c) => c !== OTHER_VALUE).map((cityName) => (
                <SelectItem key={cityName} value={cityName}>
                  {cityName}
                </SelectItem>
              ))}
              <SelectItem value={OTHER_VALUE}>{OTHER_VALUE}</SelectItem>
            </SelectContent>
          </Select>
          {showCityOther && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">Укажите город</p>
              <Input
                placeholder="Например: Анталья"
                value={cityOther}
                onChange={(e) => {
                  setCityOther(e.target.value);
                  if (fieldErrors.region) setFieldErrors((p) => ({ ...p, region: false }));
                }}
                className={cn(fieldClass, fieldErrors.region && inputErrorClass)}
              />
            </div>
          )}
        </FormSection>

        <FormSection title={`${t("trips.budget")} (USD)`} className="px-4 pb-4 space-y-3">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="5 000"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              if (fieldErrors.budget) setFieldErrors((p) => ({ ...p, budget: false }));
            }}
            className={cn(fieldClass, fieldErrors.budget && inputErrorClass)}
          />
        </FormSection>

        <FormSection title={t("trips.fundingType")} className="px-4 pb-4 space-y-3">
          <Select value={fundingMode} onValueChange={(value) => setFundingMode(value as FundingMode)}>
            <SelectTrigger className={selectClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">
                <span className="flex items-center gap-2">
                  <Banknote className="h-3.5 w-3.5" />
                  {t("trips.cashFundingShort")}
                </span>
              </SelectItem>
              <SelectItem value="debt">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  {t("trips.debtFunding")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldHint>
            <span className="block break-words whitespace-normal text-[11px] leading-4 text-muted-foreground">
              {t("trips.fundingHint")}
            </span>
          </FieldHint>
          {showDebtInput && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">{t("trips.debtAmountLabel")}</p>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5 000"
                value={debtAmount}
                onChange={(e) => {
                  setDebtAmount(e.target.value);
                  if (fieldErrors.debtAmount) setFieldErrors((p) => ({ ...p, debtAmount: false }));
                }}
                className={cn(fieldClass, fieldErrors.debtAmount && inputErrorClass)}
              />
            </div>
          )}
        </FormSection>
      </FormCard>

      <FormCard className="overflow-hidden shadow-[0_10px_24px_-18px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_24px_-18px_rgba(0,0,0,0.6)]">
        <FormSection title={t("trips.couriers")} className="px-4 pb-4">
          <CourierSelectList couriers={couriers} selectedIds={courierIds} onToggle={toggleCourier} />
        </FormSection>
      </FormCard>

      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-[15px] font-semibold shadow-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Сохранение..." : t("trips.create")}
      </Button>
    </form>
  );
}

