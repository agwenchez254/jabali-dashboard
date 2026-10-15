import { useEffect, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "@/api/baseApi";
import { useGetSettingsQuery, useSetSettingMutation } from "@/api/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EMPTY_VAT, toVatForm, toVatValue, vatErrors, type VatForm } from "@/lib/vat";
import { useCan } from "@/store/hooks";

/** VAT on receipts. Saved on its own so a mistake here cannot block the other settings. */
export default function VatSettingsCard() {
  const canWrite = useCan("settings:write");
  const { data } = useGetSettingsQuery();
  const [save, { isLoading }] = useSetSettingMutation();
  const [form, setForm] = useState<VatForm>(EMPTY_VAT);
  const [touched, setTouched] = useState(false);
  const errors = vatErrors(form);
  const set = <K extends keyof VatForm>(key: K, value: VatForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (data) setForm(toVatForm(data.vat));
  }, [data]);

  const submit = async () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    try {
      await save({ key: "vat", value: toVatValue(form) }).unwrap();
      toast.success(form.enabled ? "VAT is on for new orders" : "VAT is off for new orders");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const err = (k: keyof VatForm) => (touched && errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax (VAT)</CardTitle>
        <CardDescription>
          Turn this on only if the business is VAT-registered. Shelf prices are treated as VAT-inclusive: VAT is shown inside the price on receipts and customers never pay more than the displayed price. It applies to new orders only; existing orders keep what they were placed with. The receipt is not a KRA eTIMS tax invoice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center justify-between text-sm">Charge VAT on new orders <Switch checked={form.enabled} disabled={!canWrite} onCheckedChange={(v) => set("enabled", v)} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vat-rate">VAT rate (%)</Label>
            <Input id="vat-rate" type="number" min={0} max={30} step={0.01} value={form.ratePercent} readOnly={!canWrite} onChange={(e) => set("ratePercent", e.target.value)} />
            <p className="text-xs text-muted-foreground">The standard rate in Kenya is 16%.</p>
            {err("ratePercent")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat-pin">KRA PIN</Label>
            <Input id="vat-pin" maxLength={11} value={form.kraPin} readOnly={!canWrite} onChange={(e) => set("kraPin", e.target.value.toUpperCase())} placeholder="P051234567Z" />
            {err("kraPin")}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="vat-name">Business name on receipts</Label>
            <Input id="vat-name" maxLength={120} value={form.businessName} readOnly={!canWrite} onChange={(e) => set("businessName", e.target.value)} placeholder="Jabali Menswear Ltd" />
            {err("businessName")}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="vat-address">Address on receipts</Label>
            <Textarea id="vat-address" rows={2} maxLength={300} value={form.address} readOnly={!canWrite} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
        {canWrite && <Button onClick={submit} disabled={isLoading}>{isLoading ? "Saving..." : "Save VAT settings"}</Button>}
      </CardContent>
    </Card>
  );
}
