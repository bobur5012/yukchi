"use client";

import { useState, useEffect, useRef } from "react";
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
import { getRegions } from "@/lib/api/regions";
import { CURRENCIES } from "@/lib/constants";
import { CourierSelectList } from "@/components/couriers/CourierSelectList";
import { useTranslations } from "@/lib/useTranslations";
import type { Courier, Region } from "@/types";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection, FieldHint } from "@/components/ui/form-helpers";

export function AddTripForm() {
  const { t } = useTranslations();
  const tRef = useRef(t);
  tRef.current = t;
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [dateDeparture, setDateDeparture] = useState(today);
  const [dateReturn, setDateReturn] = useState(today);
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [regionId, setRegionId] = useState("");
  const [oldDebt, setOldDebt] = useState("");
  const [courierIds, setCourierIds] = useState<string[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);

  useEffect(() => { getCouriers().then(setCouriers); }, []);
  useEffect(() => {
    getRegions()
      .then(setRegions)
      .catch(() => toast.error(tRef.current("trips.regionsLoadError")))
      .finally(() => setRegionsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBudget = parseFloat(budget);
    if (!name || !dateDeparture || !dateReturn || isNaN(numBudget) || numBudget <= 0 || !regionId) {
      toast.error(t("common.fillAllFields")); return;
    }
    if (dateReturn < dateDeparture) {
      toast.error(t("trips.returnBeforeDeparture")); return;
    }
    try {
      await createTrip({
        name,
        departureDate: dateDeparture,
        returnDate: dateReturn,
        budget: budget,
        oldDebt: oldDebt || "0",
        currency,
        regionId,
        courierIds: courierIds.length > 0 ? courierIds : undefined,
      });
      toast.success(t("trips.created"));
      router.push("/trips");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const durationDays =
    dateDeparture && dateReturn && dateReturn >= dateDeparture
      ? Math.ceil((new Date(dateReturn).getTime() - new Date(dateDeparture).getTime()) / 86400000) + 1
      : 0;

  const toggleCourier = (id: string) =>
    setCourierIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormCard>
        <FormSection>
          <FormRow label={t("trips.name")}>
            <Input placeholder={t("trips.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
        </FormSection>

        <FormSection title={t("trips.dates")}>
          <FormRow label={t("trips.departureDate")}>
            <Input type="date" value={dateDeparture} onChange={(e) => setDateDeparture(e.target.value)} />
          </FormRow>
          <FormRow label={t("trips.returnDate")}>
            <Input type="date" value={dateReturn} onChange={(e) => setDateReturn(e.target.value)} min={dateDeparture} />
            {durationDays > 0 && (
              <FieldHint>
                {durationDays} {durationDays === 1 ? t("trips.day") : durationDays < 5 ? t("trips.daysFew") : t("trips.daysMany")}
              </FieldHint>
            )}
          </FormRow>
        </FormSection>

        <FormSection title={t("trips.region")}>
          <FormRow label={t("trips.region")}>
            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder={regionsLoading ? t("common.loading") : regions.length === 0 ? t("trips.noRegions") : t("trips.selectRegion")} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>

        <FormSection title={t("trips.budget")}>
          <FormRow label={t("trips.oldDebt")}>
            <Input type="number" placeholder="0" value={oldDebt} onChange={(e) => setOldDebt(e.target.value)} />
          </FormRow>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input type="number" placeholder="5 000" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div className="w-24">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection title={t("trips.couriers")}>
          <CourierSelectList couriers={couriers} selectedIds={courierIds} onToggle={toggleCourier} />
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full">{t("trips.create")}</Button>
    </form>
  );
}
