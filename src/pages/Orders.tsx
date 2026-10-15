import { useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetOrderQuery, useGetOrdersQuery, useLazyExportOrdersQuery, useRefundOrderMutation, useTransitionOrderMutation } from "@/api/orders";
import { errorMessage } from "@/api/baseApi";
import type { OrderStatus } from "@/api/types";
import { useCan } from "@/store/hooks";
import { dateTime, downloadText, kes } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, Pager, StatusBadge, TableSkeleton, run, useDebounced } from "@/components/shared";

const ALL = "all";
const STATUSES: OrderStatus[] = ["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"];
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export default function Orders() {
  const [status, setStatus] = useState(ALL);
  const [method, setMethod] = useState(ALL);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const dq = useDebounced(q);
  const filters = { status: status === ALL ? undefined : status, method: method === ALL ? undefined : method, q: dq || undefined };
  const { data, isFetching } = useGetOrdersQuery({ ...filters, page, pageSize: 15 });
  const [exportOrders, { isFetching: exporting }] = useLazyExportOrdersQuery();

  const onExport = async () => {
    const r = await exportOrders(filters);
    if (r.data) downloadText(`orders-${new Date().toISOString().slice(0, 10)}.csv`, r.data);
    else toast.error(errorMessage(r.error));
  };

  return (
    <>
      <PageHeader title="Orders" description="Track and fulfil customer orders.">
        <Button variant="outline" onClick={onExport} disabled={exporting}>
          <Download /> {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </PageHeader>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Order number, name or phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={(v) => { setMethod(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any method</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>No orders found.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden sm:table-cell">Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => setOpenId(o.id)}>
                  <TableCell>
                    <button className="font-medium hover:underline" onClick={() => setOpenId(o.id)}>{o.number}</button>
                    <p className="text-xs text-muted-foreground">{dateTime(o.createdAt)}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {o.customer?.name}
                    <p className="text-xs text-muted-foreground">{o.county ?? o.method}</p>
                  </TableCell>
                  <TableCell><StatusBadge value={o.status} /></TableCell>
                  <TableCell className="hidden md:table-cell uppercase">{o.paymentMethod}</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(o.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pager page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />}

      <OrderSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function OrderSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const canWrite = useCan("order:write");
  const canRefund = useCan("order:refund");
  const { data: o, isFetching } = useGetOrderQuery(id!, { skip: !id });
  const [transition, { isLoading }] = useTransitionOrderMutation();
  const [refund] = useRefundOrderMutation();

  return (
    <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{o?.number ?? "Order"}</SheetTitle>
          <SheetDescription>{o ? dateTime(o.createdAt) : ""}</SheetDescription>
        </SheetHeader>
        {isFetching || !o ? (
          <div className="space-y-3 px-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="space-y-5 px-4 pb-6 text-sm">
            <div className="flex items-center justify-between">
              <StatusBadge value={o.status} />
              <span className="uppercase text-muted-foreground">{o.paymentMethod}</span>
            </div>
            <div>
              <p className="font-medium">{o.customer?.name}</p>
              <p className="text-muted-foreground">{o.customer?.phone}</p>
              <p className="text-muted-foreground">{o.method === "pickup" ? "Pickup" : [o.address, o.county].filter(Boolean).join(", ")}</p>
            </div>
            <Separator />
            <ul className="space-y-2">
              {o.lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span>
                    {l.qty} x {l.name}
                    <span className="block text-xs text-muted-foreground">{l.colour} · {l.size}{l.gift ? " · gift wrapped" : ""}</span>
                  </span>
                  <span className="tabular-nums">{kes(l.unitPrice * l.qty)}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <dl className="space-y-1 tabular-nums">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{kes(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd>-{kes(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{kes(o.deliveryFee)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{kes(o.total)}</dd></div>
              {o.vat && <div className="flex justify-between text-muted-foreground"><dt>incl. VAT ({o.vat.ratePercent}%)</dt><dd>{kes(o.vat.amount)}</dd></div>}
            </dl>

            {canWrite && NEXT[o.status].length > 0 && (
              <div className="flex flex-wrap gap-2">
                {NEXT[o.status].map((to) => (
                  <Button key={to} size="sm" variant={to === "cancelled" ? "outline" : "default"} className="capitalize" disabled={isLoading} onClick={() => run(transition({ id: o.id, to }), `Order marked ${to}`)}>
                    Mark {to}
                  </Button>
                ))}
              </div>
            )}
            {canRefund && ["paid", "packed", "shipped", "delivered"].includes(o.status) && (
              <ConfirmButton title="Refund this order?" description={`This refunds ${kes(o.total)} and releases the order.`} onConfirm={() => run(refund({ id: o.id }), "Order refunded")} trigger={<Button size="sm" variant="outline" className="text-destructive">Refund</Button>} />
            )}

            {o.events && o.events.length > 0 && (
              <>
                <Separator />
                <ol className="space-y-2">
                  {o.events.map((e) => (
                    <li key={e.id} className="flex justify-between gap-3 text-muted-foreground">
                      <span className="capitalize">{e.type.replace("_", " ")}{e.note ? `: ${e.note}` : ""}</span>
                      <span className="shrink-0">{dateTime(e.at ?? e.createdAt)}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
