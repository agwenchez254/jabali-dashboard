import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCreateZoneMutation, useDeleteZoneMutation, useGetZonesQuery, useUpdateZoneMutation } from "@/api/operations";
import type { Zone } from "@/api/types";
import { useCan } from "@/store/hooks";
import { kes } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, StatusBadge, TableSkeleton, run } from "@/components/shared";

export default function Delivery() {
  const canWrite = useCan("delivery:write");
  const { data, isFetching } = useGetZonesQuery();
  const [remove] = useDeleteZoneMutation();
  const [editing, setEditing] = useState<Zone | "new" | null>(null);

  return (
    <>
      <PageHeader title="Delivery zones" description="Fees and delivery times by county.">
        {canWrite && (
          <Button onClick={() => setEditing("new")}>
            <Plus /> New zone
          </Button>
        )}
      </PageHeader>
      {isFetching && !data ? (
        <TableSkeleton rows={4} />
      ) : !data?.length ? (
        <Empty>No delivery zones.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead className="hidden md:table-cell">Counties</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Free over</TableHead>
                <TableHead>Status</TableHead>
                {canWrite && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((z) => (
                <TableRow key={z.id}>
                  <TableCell>
                    <span className="font-medium">{z.name}</span>
                    <span className="block text-xs text-muted-foreground">{z.eta ?? (z.etaDays ? `${z.etaDays} days` : "")}</span>
                  </TableCell>
                  <TableCell className="hidden max-w-64 truncate md:table-cell text-muted-foreground">{z.counties.join(", ")}</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(z.fee)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">{z.freeOver ? kes(z.freeOver) : "-"}</TableCell>
                  <TableCell><StatusBadge value={z.active ? "active" : "paused"} /></TableCell>
                  {canWrite && (
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => setEditing(z)}><Pencil /></Button>
                        <ConfirmButton title={`Delete ${z.name}?`} description="Customers in these counties will no longer get a quote." onConfirm={() => run(remove(z.id), "Zone deleted")} trigger={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Delete"><Trash2 /></Button>} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>{editing && <ZoneForm key={editing === "new" ? "new" : editing.id} zone={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}</DialogContent>
      </Dialog>
    </>
  );
}

function ZoneForm({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  const [create, { isLoading: c }] = useCreateZoneMutation();
  const [update, { isLoading: u }] = useUpdateZoneMutation();
  const [name, setName] = useState(zone?.name ?? "");
  const [code, setCode] = useState(zone?.code ?? "");
  const [counties, setCounties] = useState(zone?.counties.join(", ") ?? "");
  const [fee, setFee] = useState(String(zone?.fee ?? 0));
  const [freeOver, setFreeOver] = useState(zone?.freeOver ? String(zone.freeOver) : "");
  const [eta, setEta] = useState(zone?.eta ?? "");
  const [active, setActive] = useState(zone?.active ?? true);

  const submit = async () => {
    const body = { name: name.trim(), code: code.trim().toLowerCase(), counties: counties.split(",").map((s) => s.trim()).filter(Boolean), fee: Number(fee) || 0, freeOver: freeOver ? Number(freeOver) : null, eta: eta.trim() || undefined, sortOrder: zone?.sortOrder ?? 0, active };
    const ok = zone ? await run(update({ id: zone.id, body }), "Zone saved") : await run(create(body as Omit<Zone, "id">), "Zone created");
    if (ok) onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{zone ? "Edit zone" : "New zone"}</DialogTitle>
        <DialogDescription>Customers are matched to a zone by county.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="zname">Name</Label><Input id="zname" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="zcode">Code</Label><Input id="zcode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="nairobi" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="zcounties">Counties (comma separated)</Label><Textarea id="zcounties" rows={2} value={counties} onChange={(e) => setCounties(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="zfee">Fee (KES)</Label><Input id="zfee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="zfree">Free over (KES)</Label><Input id="zfree" type="number" min={0} value={freeOver} onChange={(e) => setFreeOver(e.target.value)} placeholder="Never" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="zeta">Delivery time</Label><Input id="zeta" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="1 to 2 days" /></div>
        <label className="flex items-center justify-between text-sm sm:col-span-2">Active <Switch checked={active} onCheckedChange={setActive} /></label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={c || u || !name.trim() || !code.trim() || !counties.trim()}>{c || u ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </>
  );
}
