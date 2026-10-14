import { useState } from "react";
import { History, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdjustInventoryMutation, useGetInventoryQuery, useLazyGetMovementsQuery } from "@/api/catalogue";
import type { InventoryRow } from "@/api/types";
import { useCan } from "@/store/hooks";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader, Pager, TableSkeleton, run, useDebounced } from "@/components/shared";

export default function Inventory() {
  const canWrite = useCan("inventory:write");
  const [q, setQ] = useState("");
  const [low, setLow] = useState(false);
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, isFetching } = useGetInventoryQuery({ q: dq || undefined, low: low || undefined, page, pageSize: 20 });
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);
  const [history, setHistory] = useState<InventoryRow | null>(null);
  const [loadMovements, { data: movements, isFetching: loadingMoves }] = useLazyGetMovementsQuery();

  return (
    <>
      <PageHeader title="Inventory" description="Stock by variant. Every change is recorded." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search product or SKU" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={low} onCheckedChange={(c) => { setLow(c); setPage(1); }} /> Low stock only
        </label>
      </div>

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>No variants found.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden sm:table-cell">Variant</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="hidden md:table-cell text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((r) => (
                <TableRow key={r.variantId}>
                  <TableCell>
                    <span className="font-medium">{r.productName}</span>
                    <span className="block text-xs text-muted-foreground sm:hidden">
                      {r.colour} · {r.size}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {r.colour} · {r.size}
                    <span className="block font-mono text-xs text-muted-foreground">{r.sku}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.onHand}</TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums">{r.reserved}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.low ? <Badge variant="destructive">{r.available}</Badge> : r.available}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" aria-label="History" onClick={() => { setHistory(r); loadMovements(r.variantId); }}>
                        <History />
                      </Button>
                      {canWrite && (
                        <Button variant="outline" size="sm" onClick={() => setAdjusting(r)}>
                          Adjust
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pager page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />}

      <AdjustDialog row={adjusting} onClose={() => setAdjusting(null)} />

      <Sheet open={!!history} onOpenChange={(o) => !o && setHistory(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Stock history</SheetTitle>
            <SheetDescription>{history ? `${history.productName}, ${history.colour} ${history.size}` : ""}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">
            {loadingMoves ? (
              <TableSkeleton rows={4} />
            ) : !movements?.length ? (
              <Empty>No movements yet.</Empty>
            ) : (
              <ul className="divide-y text-sm">
                {movements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      <span className="capitalize">{m.reason}</span>
                      <span className="block text-xs text-muted-foreground">{dateTime(m.createdAt)}{m.actor ? ` · ${m.actor.name}` : ""}</span>
                    </span>
                    <span className={`tabular-nums ${m.delta < 0 ? "text-destructive" : "text-emerald-600"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
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

function AdjustDialog({ row, onClose }: { row: InventoryRow | null; onClose: () => void }) {
  const [adjust, { isLoading }] = useAdjustInventoryMutation();
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");

  return (
    <Dialog open={!!row} onOpenChange={(o) => { if (!o) { onClose(); setValue(""); setNote(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set stock level</DialogTitle>
          <DialogDescription>{row ? `${row.productName}, ${row.colour} ${row.size}. Currently ${row.onHand} on hand.` : ""}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="setTo">New on-hand quantity</Label>
            <Input id="setTo" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restock</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={isLoading || value === ""} onClick={async () => { if (await run(adjust({ variantId: row!.variantId, setTo: Number(value), reason, note: note || undefined }), "Stock updated")) onClose(); }}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
