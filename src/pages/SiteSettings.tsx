import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useGetSettingsQuery, useSetSettingMutation } from "@/api/content";
import { useCan } from "@/store/hooks";
import { toast } from "sonner";
import { errorMessage } from "@/api/baseApi";
import { PageHeader } from "@/components/shared";
import VatSettingsCard from "./VatSettingsCard";

const METHODS = [
  { id: "mpesa", label: "M-Pesa" },
  { id: "cod", label: "Cash on delivery" },
  { id: "airtel", label: "Airtel Money" },
  { id: "card", label: "Card" },
];

export default function SiteSettings() {
  const canWrite = useCan("settings:write");
  const { data, isLoading } = useGetSettingsQuery();
  const [save, { isLoading: saving }] = useSetSettingMutation();
  const [whatsapp, setWhatsapp] = useState("");
  const [pickup, setPickup] = useState("");
  const [threshold, setThreshold] = useState("");
  const [bar, setBar] = useState({ enabled: false, text: "", link: "", linkLabel: "" });
  const [methods, setMethods] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setWhatsapp(String(data.whatsappNumber ?? ""));
    setPickup(String(data.pickupAddress ?? ""));
    setThreshold(data.freeDeliveryThreshold != null ? String(data.freeDeliveryThreshold) : "");
    const b = data.announcementBar as { enabled?: boolean; text?: string; link?: string; linkLabel?: string } | undefined;
    setBar({ enabled: !!b?.enabled, text: b?.text ?? "", link: b?.link ?? "", linkLabel: b?.linkLabel ?? "" });
    setMethods((data.paymentMethods as string[] | undefined) ?? []);
  }, [data]);

  if (isLoading) return <Skeleton className="h-96" />;

  const saveAll = async () => {
    try {
      await save({ key: "whatsappNumber", value: whatsapp.trim() }).unwrap();
      await save({ key: "pickupAddress", value: pickup.trim() }).unwrap();
      await save({ key: "freeDeliveryThreshold", value: threshold ? Number(threshold) : null }).unwrap();
      await save({ key: "announcementBar", value: { enabled: bar.enabled, text: bar.text.trim(), ...(bar.link.trim() && { link: bar.link.trim(), linkLabel: bar.linkLabel.trim() || "Shop now" }) } }).unwrap();
      await save({ key: "paymentMethods", value: methods }).unwrap();
      toast.success("Settings saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const toggle = (id: string) => setMethods((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  return (
    <>
      <PageHeader title="Site settings" description="Store-wide options used by the storefront and checkout." />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Announcement bar</CardTitle><CardDescription>A promotion strip at the top of every storefront page. Add a link for a call-to-action button.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between text-sm">Show the banner <Switch checked={bar.enabled} disabled={!canWrite} onCheckedChange={(enabled) => setBar((b) => ({ ...b, enabled }))} /></label>
            <Textarea rows={2} value={bar.text} readOnly={!canWrite} onChange={(e) => setBar((b) => ({ ...b, text: e.target.value }))} placeholder="Free delivery in Nairobi on orders above KES 10,000" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="bar-link">Button link</Label><Input id="bar-link" value={bar.link} readOnly={!canWrite} onChange={(e) => setBar((b) => ({ ...b, link: e.target.value }))} placeholder="/shop or https://..." /></div>
              <div className="space-y-2"><Label htmlFor="bar-label">Button text</Label><Input id="bar-label" maxLength={40} value={bar.linkLabel} readOnly={!canWrite} onChange={(e) => setBar((b) => ({ ...b, linkLabel: e.target.value }))} placeholder="Shop now" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Customer care and pickup</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="wa">WhatsApp number</Label><Input id="wa" value={whatsapp} readOnly={!canWrite} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+254712480316" /></div>
            <div className="space-y-2"><Label htmlFor="thr">Free delivery over (KES)</Label><Input id="thr" type="number" min={0} value={threshold} readOnly={!canWrite} onChange={(e) => setThreshold(e.target.value)} placeholder="Never" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="pick">Pickup address</Label><Textarea id="pick" rows={2} value={pickup} readOnly={!canWrite} onChange={(e) => setPickup(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Payment methods</CardTitle><CardDescription>Offered at checkout.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {METHODS.map((m) => (
              <label key={m.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">{m.label}<Switch checked={methods.includes(m.id)} disabled={!canWrite} onCheckedChange={() => toggle(m.id)} /></label>
            ))}
          </CardContent>
        </Card>

        <VatSettingsCard />

        {canWrite && <div><Button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button></div>}
      </div>
    </>
  );
}
