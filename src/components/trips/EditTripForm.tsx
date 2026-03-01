"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTrip, updateTrip } from "@/lib/api/trips";
import { TURKEY_CITIES } from "@/lib/constants";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection, FieldHint } from "@/components/ui/form-helpers";

const OTHER_VALUE = "Другое";
type FundingMode = "cash" | "debt";

export function EditTripForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [dateDeparture, setDateDeparture] = useState("");
  const [dateReturn, setDateReturn] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [status, setStatus] = useState<string>("planned");
  const [fundingMode, setFundingMode] = useState<FundingMode>("cash");
  const [debtAmount, setDebtAmount] = useState("0");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    getTrip(id)
      .then((trip) => {
        setName(trip.name);
        setDateDeparture(trip.departureDate?.split("T")[0] || "");
        setDateReturn(trip.returnDate?.split("T")[0] || "");
        setBudget(trip.budget || "");

        const regionName = trip.region?.name || "";
        const inList = (TURKEY_CITIES as readonly string[]).includes(regionName);
        setCity(inList ? regionName : OTHER_VALUE);
        setCityOther(inList ? "" : regionName);
        setStatus(trip.status || "planned");

        const oldDebt = Number.parseFloat(trip.oldDebt || "0");
        if (oldDebt > 0) {
          setFundingMode("debt");
          setDebtAmount(oldDebt.toFixed(2));
        } else {
          setFundingMode("cash");
          setDebtAmount("0");
        }
      })
      .catch(() => toast.error("Поездка не найдена"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBudget = Number.parseFloat(budget);
    const regionId = city === OTHER_VALUE ? cityOther.trim() : city;
    const numDebt = fundingMode === "debt" ? Number.parseFloat(debtAmount) : 0;

    if (!name.trim() || !dateDeparture || !dateReturn || Number.isNaN(numBudget) || numBudget <= 0 || !regionId) {
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
    if (!id) return;

    setIsSubmitting(true);
    try {
      await updateTrip(id, {
        name: name.trim(),
        departureDate: dateDeparture,
        returnDate: dateReturn,
        budget,
        oldDebt: fundingMode === "debt" ? numDebt.toFixed(2) : "0",
        regionId,
        status,
      });
      toast.success("Поездка обновлена");
      router.push("/trips");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[100px] rounded-2xl bg-muted/50 animate-pulse" />
        <div className="h-[220px] rounded-2xl bg-muted/50 animate-pulse" />
      </div>
    );
  }

  const showCityOther = city === OTHER_VALUE;
  const showDebtInput = fundingMode === "debt";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
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
        </FormSection>

        <FormSection title="Город Турции">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
              <SelectValue placeholder="Выберите город" />
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
            Наличка: закупка на деньги магазина. Долг: товар и доставка будут в задолженности магазина.
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

        <FormRow label="Статус">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[100]">
              <SelectItem value="planned">Запланирована</SelectItem>
              <SelectItem value="active">Активна</SelectItem>
              <SelectItem value="completed">Завершена</SelectItem>
              <SelectItem value="cancelled">Отменена</SelectItem>
            </SelectContent>
          </Select>
        </FormRow>
      </FormCard>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
