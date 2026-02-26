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
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

const OTHER_VALUE = "Другое";

export function EditTripForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(Boolean(id));
  const [name, setName] = useState("");
  const [dateDeparture, setDateDeparture] = useState("");
  const [dateReturn, setDateReturn] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [status, setStatus] = useState<string>("planned");

  useEffect(() => {
    if (!id) return;
    getTrip(id)
      .then((tr) => {
        setName(tr.name);
        setDateDeparture(tr.departureDate?.split("T")[0] || "");
        setDateReturn(tr.returnDate?.split("T")[0] || "");
        setBudget(tr.budget || "");
        const regionName = tr.region?.name || "";
        const inList = (TURKEY_CITIES as readonly string[]).includes(regionName);
        setCity(inList ? regionName : OTHER_VALUE);
        setCityOther(inList ? "" : regionName);
        setStatus(tr.status || "planned");
      })
      .catch(() => toast.error("Поездка не найдена"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBudget = parseFloat(budget);
    const regionId = city === OTHER_VALUE ? cityOther.trim() : city;
    if (!name.trim() || !dateDeparture || !dateReturn || isNaN(numBudget) || numBudget <= 0 || !regionId) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    if (dateReturn < dateDeparture) {
      toast.error(t("trips.returnBeforeDeparture"));
      return;
    }
    if (!id) return;

    try {
      await updateTrip(id, {
        name: name.trim(),
        departureDate: dateDeparture,
        returnDate: dateReturn,
        budget,
        regionId,
        status,
      });
      toast.success("Поездка обновлена");
      router.push("/trips");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  if (loading) {
    return (
      <div className="pb-20 space-y-4">
        <div className="h-[100px] rounded-2xl bg-muted/50 animate-pulse" />
        <div className="h-[200px] rounded-2xl bg-muted/50 animate-pulse" />
      </div>
    );
  }

  const showCityOther = city === OTHER_VALUE;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormCard>
        <FormSection>
          <FormRow label={t("trips.name")}>
            <Input
              placeholder={t("trips.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormRow>
        </FormSection>

        <FormSection title={t("trips.dates")}>
          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{t("trips.departureDate")}</p>
              <Input
                type="date"
                value={dateDeparture}
                onChange={(e) => setDateDeparture(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{t("trips.returnDate")}</p>
              <Input
                type="date"
                value={dateReturn}
                onChange={(e) => setDateReturn(e.target.value)}
                min={dateDeparture}
              />
            </div>
          </div>
        </FormSection>

        <FormSection>
          <FormRow label="Город Турции">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder="Выберите город" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {TURKEY_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
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
          </FormRow>

          <FormRow label={`${t("trips.budget")} (USD)`}>
            <Input
              type="number"
              step="0.01"
              placeholder="5 000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </FormRow>
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

      <Button type="submit" className="w-full">
        Сохранить
      </Button>
    </form>
  );
}
