import { useState } from "react";
import { Pause, Pencil, Play, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActivatePromotionMutation, useCreatePromotionMutation, useDeletePromotionMutation, useGetPromotionsQuery, useLazyGetRedemptionsQuery, usePausePromotionMutation, useUpdatePromotionMutation } from "@/api/promotions";
import { useGetCategoriesQuery } from "@/api/catalogue";
import type { Promotion, PromotionBody, PromotionType } from "@/api/types";
import { useCan } from "@/store/hooks";
import { dateTime, kes, shortDate, toLocalInput } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, StatusBadge, TableSkeleton, run } from "@/components/shared";

const typeLabel: Record<PromotionType, string> = { percent: "Percent off", fixed: "Amount off", free_delivery: "Free delivery", bogo: "Buy one get one" };
const describe = (p: Promotion) => (p.type === "percent" ? `${p.value}% off` : p.type === "fixed" ? `${kes(p.value)} off` : typeLabel[p.type]);

export default function Promotions() {
  const canWrite = useCan("promotion:write");
  const { data, isFetching } = useGetPromotionsQuery({ pageSize: 50 });
  const [activate] = useActivatePromotionMutation();
  const [pause] = usePausePromotionMutation();
  const [remove] = useDeletePromotionMutation();
  const [editing, setEditing] = useState<Promotion | "new" | null>(null);
  const [viewing, setViewing] = useState<Promotion | null>(null);
  const [loadRedemptions, { data: redemptions, isFetching: loadingR }] = useLazyGetRedemptionsQuery();
  const rows = Array.isArray(redemptions) ? redemptions : (redemptions?.items ?? []);

  return (
    <>
      <PageHeader title="Promotions" description="Discount codes and automatic offers.">
        {canWrite && (
          <Button onClick={() => setEditing("new")}>
            <Plus /> New promotion
          </Button>
        )}
      </PageHeader>

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>No promotions yet.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promotion</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="hidden md:table-cell">Runs</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Used</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-medium">{p.name}</span>
                    {p.code && <span className="block font-mono text-xs text-muted-foreground">{p.code}</span>}
                  </TableCell>
                  <TableCell>{describe(p)}</TableCell>
                  <TableCell><StatusBadge value={p.state} /></TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {p.startsAt ? shortDate(p.startsAt) : "Now"} to {p.endsAt ? shortDate(p.endsAt) : "no end"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">
                    {p.usedCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Redemptions" onClick={() => { setViewing(p); loadRedemptions(p.id); }}>
                        <Users />
                      </Button>
                      {canWrite && (
                        <>
                          {p.status === "active" ? (
                            <Button variant="ghost" size="icon" className="size-8" aria-label="Pause" onClick={() => run(pause(p.id), "Promotion paused")}><Pause /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="size-8" aria-label="Activate" onClick={() => run(activate(p.id), "Promotion activated")}><Play /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => setEditing(p)}><Pencil /></Button>
                          <ConfirmButton title={`Delete ${p.name}?`} description="Past orders keep their discount." onConfirm={() => run(remove(p.id), "Promotion deleted")} trigger={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Delete"><Trash2 /></Button>} />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PromotionDialog target={editing} onClose={() => setEditing(null)} />

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{viewing?.name}</SheetTitle>
            <SheetDescription>Redemptions</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            {loadingR ? <TableSkeleton rows={3} /> : !rows.length ? <Empty>Not used yet.</Empty> : (
              <ul className="divide-y text-sm">
                {rows.map((r, i) => (
                  <li key={String(r.id ?? i)} className="flex justify-between py-2">
                    <span>{String(r.orderNumber ?? r.customerRef ?? "Order")}</span>
                    <span className="tabular-nums">{kes(Number(r.amount ?? 0))}{r.createdAt ? ` · ${dateTime(String(r.createdAt))}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function PromotionDialog({ target, onClose }: { target: Promotion | "new" | null; onClose: () => void }) {
  const existing = target && target !== "new" ? target : null;
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {target && <PromotionForm key={existing?.id ?? "new"} existing={existing} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function PromotionForm({ existing, onClose }: { existing: Promotion | null; onClose: () => void }) {
  const [create, { isLoading: c }] = useCreatePromotionMutation();
  const [update, { isLoading: u }] = useUpdatePromotionMutation();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [name, setName] = useState(existing?.name ?? "");
  const [code, setCode] = useState(existing?.code ?? "");
  const [type, setType] = useState<PromotionType>(existing?.type ?? "percent");
  const [value, setValue] = useState(String(existing?.value ?? 10));
  const [startsAt, setStartsAt] = useState(toLocalInput(existing?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(existing?.endsAt));
  const [usageLimit, setUsageLimit] = useState(existing?.usageLimit ? String(existing.usageLimit) : "");
  const [minSubtotal, setMinSubtotal] = useState(String(existing?.minSubtotal ?? 0));
  const [stackable, setStackable] = useState(existing?.stackable ?? false);
  const [categoryId, setCategoryId] = useState(existing?.targets.find((t) => t.targetType === "category")?.targetId ?? "all");
  const needsValue = type === "percent" || type === "fixed";

  const submit = async () => {
    const body: PromotionBody = {
      name: name.trim(),
      code: code.trim() ? code.trim().toUpperCase() : undefined,
      type,
      value: needsValue ? Number(value) : 0,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      minSubtotal: Number(minSubtotal) || 0,
      stackable,
      targets: categoryId === "all" ? [{ targetType: "all" }] : [{ targetType: "category", targetId: categoryId }],
    };
    const ok = existing ? await run(update({ id: existing.id, body }), "Promotion saved") : await run(create(body), "Promotion created");
    if (ok) onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{existing ? "Edit promotion" : "New promotion"}</DialogTitle>
        <DialogDescription>Leave the code empty for an automatic offer.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pname">Name</Label>
          <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pcode">Code</Label>
          <Input id="pcode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" className="uppercase" />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as PromotionType)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(typeLabel) as PromotionType[]).map((t) => (
                <SelectItem key={t} value={t}>{typeLabel[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {needsValue && (
          <div className="space-y-2">
            <Label htmlFor="pvalue">{type === "percent" ? "Percent" : "Amount (KES)"}</Label>
            <Input id="pvalue" type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="pmin">Minimum subtotal (KES)</Label>
          <Input id="pmin" type="number" min={0} value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pstart">Starts</Label>
          <Input id="pstart" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pend">Ends</Label>
          <Input id="pend" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plimit">Total usage limit</Label>
          <Input id="plimit" type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" />
        </div>
        <div className="space-y-2">
          <Label>Applies to</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everything</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label} ({cat.gender})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm sm:col-span-2">
          Can be combined with other promotions <Switch checked={stackable} onCheckedChange={setStackable} />
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={c || u || name.trim().length < 2}>{c || u ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </>
  );
}
