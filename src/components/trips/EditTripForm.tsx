"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  FormCard,
  FormRow,
  FormSection,
  FieldHint,
  FormHero,
  FormMetaPill,
} from "@/components/ui/form-helpers";
import { Plane, Calendar, Wallet } from "lucide-react";

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
  const durationDays = useMemo(() => {
    if (!dateDeparture || !dateReturn || dateReturn < dateDeparture) return 0;
    return Math.ceil((new Date(dateReturn).getTime() - new Date(dateDeparture).getTime()) / 86400000) + 1;
  }, [dateDeparture, dateReturn]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormHero
        icon={<Plane className="size-5" />}
        title="Обновить поездку"
        description="Корректируйте даты, бюджет и формат финансирования в том же премиальном мобильном стиле."
        meta={
          <>
            <FormMetaPill label={t("trips.departureDate")} value={dateDeparture || "—"} />
            <FormMetaPill label={t("trips.returnDate")} value={dateReturn || "—"} />
            <FormMetaPill label={t("trips.remaining")} value={durationDays > 0 ? `${durationDays} дн.` : "—"} />
          </>
        }
      />

      <FormCard>
        <FormSection>
          <FormRow label={t("trips.name")}>
            <Input placeholder={t("trips.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
        </FormSection>

        <FormSection title={t("trips.dates")} className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t("trips.departureDate")}</span>
              </div>
              <Input type="date" value={dateDeparture} onChange={(e) => setDateDeparture(e.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t("trips.returnDate")}</span>
              </div>
              <Input type="date" value={dateReturn} onChange={(e) => setDateReturn(e.target.value)} min={dateDeparture} />
            </div>
          </div>
          {durationDays > 0 ? <FieldHint>{durationDays} дн.</FieldHint> : null}
        </FormSection>

        <FormSection title="Город Турции" className="px-5 pb-5">
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

        <FormSection title={`${t("trips.budget")} (USD)`} className="px-5 pb-5">
          <Input type="number" step="0.01" placeholder="5 000" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </FormSection>

        <FormSection title="Тип финансирования" className="px-5 pb-5">
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

      <FormCard className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Бюджет</p>
            <p className="mt-1 text-[14px] font-semibold tracking-[-0.03em]">{budget || "—"} $</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Формат</p>
            <p className="mt-1 text-[14px] font-semibold tracking-[-0.03em]">
              {fundingMode === "debt" ? "Долг" : "Наличные"}
            </p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Старый долг</p>
            <p className="mt-1 text-[14px] font-semibold tracking-[-0.03em]">
              {fundingMode === "debt" ? debtAmount || "—" : "0"} $
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground">
          <Wallet className="size-4 text-primary" />
          История поездки сохранится, изменятся только актуальные параметры.
        </div>
      </FormCard>

      <Button type="submit" className="h-12 w-full rounded-[22px]" disabled={isSubmitting}>
        {isSubmitting ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
