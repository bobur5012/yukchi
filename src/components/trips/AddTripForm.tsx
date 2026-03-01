"use client";

import { useState, useEffect } from "react";
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
import type { Courier } from "@/types";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection, FieldHint } from "@/components/ui/form-helpers";

const OTHER_VALUE = "Другое";
type FundingMode = "cash" | "debt";

export function AddTripForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

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

  useEffect(() => {
    getCouriers().then(setCouriers);
  }, []);

  useEffect(() => {
    if (fundingMode === "cash") {
      setDebtAmount("0");
    } else if (fundingMode === "debt" && (!debtAmount || debtAmount === "0") && budget) {
      setDebtAmount(budget);
    }
  }, [fundingMode, budget, debtAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numBudget = Number.parseFloat(budget);
    const regionId = city === OTHER_VALUE ? cityOther.trim() : city;
    const numDebt = fundingMode === "debt" ? Number.parseFloat(debtAmount) : 0;

    if (!name || !dateDeparture || !dateReturn || Number.isNaN(numBudget) || numBudget <= 0 || !regionId) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    if (dateReturn < dateDeparture) {
      toast.error(t("trips.returnBeforeDeparture"));
      return;
    }
    if (fundingMode === "debt" && (Number.isNaN(numDebt) || numDebt <= 0)) {
      toast.error("Укажите сумму долга");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrip({
        name,
        departureDate: dateDeparture,
        returnDate: dateReturn,
        budget,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20 max-w-md mx-auto">
      <FormCard>
        <FormSection>
          <FormRow label={t("trips.name")}>
            <Input placeholder={t("trips.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
        </FormSection>

        <FormSection title={t("trips.dates")}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{t("trips.departureDate")}</p>
              <Input type="date" value={dateDeparture} onChange={(e) => setDateDeparture(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{t("trips.returnDate")}</p>
              <Input type="date" value={dateReturn} onChange={(e) => setDateReturn(e.target.value)} min={dateDeparture} />
            </div>
          </div>
          {durationDays > 0 && (
            <FieldHint>
              {durationDays} {durationDays === 1 ? t("trips.day") : durationDays < 5 ? t("trips.daysFew") : t("trips.daysMany")}
            </FieldHint>
          )}
        </FormSection>

        <FormSection title={t("trips.region")}>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
              <SelectValue placeholder={t("trips.selectRegion")} />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[100]">
              {TURKEY_CITIES.map((cityName) => (
                <SelectItem key={cityName} value={cityName}>
                  {cityName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showCityOther && (
            <div className="mt-3">
              <Input
                placeholder="Укажите город"
                value={cityOther}
                onChange={(e) => setCityOther(e.target.value)}
                className="h-[44px] rounded-xl"
              />
            </div>
          )}
        </FormSection>

        <FormSection title={`${t("trips.budget")} (USD)`}>
          <Input type="number" step="0.01" placeholder="5 000" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </FormSection>

        <FormSection title="Тип финансирования">
          <Select value={fundingMode} onValueChange={(value) => setFundingMode(value as FundingMode)}>
            <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Наличка (магазин дал деньги)</SelectItem>
              <SelectItem value="debt">Долг (закуп за счет организации)</SelectItem>
            </SelectContent>
          </Select>
          <FieldHint>
            Наличка: закупка на деньги магазина. Долг: товар + доставка добавятся в задолженность магазина.
          </FieldHint>
          {showDebtInput && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1.5">Сумма долга (USD)</p>
              <Input
                type="number"
                step="0.01"
                placeholder="5000"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
              />
            </div>
          )}
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection title={t("trips.couriers")}>
          <CourierSelectList couriers={couriers} selectedIds={courierIds} onToggle={toggleCourier} />
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Сохранение..." : t("trips.create")}
      </Button>
    </form>
  );
}
