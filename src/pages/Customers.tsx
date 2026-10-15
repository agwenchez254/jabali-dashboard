import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActivateCustomerMutation, useDeactivateCustomerMutation, useGetCustomerQuery, useGetCustomersQuery, type CustomerStatus } from "@/api/customers";
import { errorMessage } from "@/api/baseApi";
import { useCan } from "@/store/hooks";
import { dateTime, kes, shortDate } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, Pager, StatusBadge, TableSkeleton, run, useDebounced } from "@/components/shared";

const ALL = "all";
const STATUSES: CustomerStatus[] = ["active", "disabled", "unverified", "guest"];

interface Blocking {
  id: string;
  number: string | null;
  status: string;
}

export default function Customers() {
  const [status, setStatus] = useState(ALL);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const dq = useDebounced(q);
  const { data, isFetching } = useGetCustomersQuery({ status: status === ALL ? undefined : (status as CustomerStatus), q: dq || undefined, page, pageSize: 15 });

  return (
    <>
      <PageHeader title="Customers" description="People who have signed up or ordered. Deactivating an account blocks sign-in." />

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Name, email or phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All customers</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>No customers found.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Orders</TableHead>
                <TableHead className="hidden md:table-cell text-right">Spent</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                  <TableCell>
                    <button className="font-medium hover:underline" onClick={() => setOpenId(c.id)}>{c.name}</button>
                    <p className="text-xs text-muted-foreground">{c.email ?? c.phone}</p>
                  </TableCell>
                  <TableCell><StatusBadge value={c.status} /></TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">
                    {c.orders}
                    {c.activeOrders > 0 && <span className="ml-1 text-xs text-muted-foreground">({c.activeOrders} active)</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums">{kes(c.totalSpent)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{shortDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pager page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />}

      <CustomerSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function CustomerSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const canWrite = useCan("customer:write");
  const { data: c, isFetching } = useGetCustomerQuery(id!, { skip: !id });
  const [deactivate, { isLoading: deactivating }] = useDeactivateCustomerMutation();
  const [activate, { isLoading: activating }] = useActivateCustomerMutation();
  const [blocking, setBlocking] = useState<Blocking[]>([]);

  const onDeactivate = async () => {
    if (!c) return;
    setBlocking([]);
    try {
      await deactivate(c.id).unwrap();
      toast.success("Account deactivated");
    } catch (e) {
      const d = (e as { data?: { code?: string; orders?: Blocking[] } }).data;
      if (d?.code === "active_orders") setBlocking(d.orders ?? []);
      else toast.error(errorMessage(e));
    }
  };

  const activeOrders = c?.orderList.filter((o) => o.active) ?? [];

  return (
    <Sheet open={!!id} onOpenChange={(open) => { if (!open) { setBlocking([]); onClose(); } }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{c?.name ?? "Customer"}</SheetTitle>
          <SheetDescription>{c ? `Joined ${dateTime(c.createdAt)}` : ""}</SheetDescription>
        </SheetHeader>
        {isFetching || !c ? (
          <div className="space-y-3 px-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="space-y-5 px-4 pb-6 text-sm">
            <div className="flex items-center justify-between">
              <StatusBadge value={c.status} />
              <span className="text-muted-foreground">{c.lastLoginAt ? `Last sign-in ${dateTime(c.lastLoginAt)}` : "Never signed in"}</span>
            </div>
            <div>
              <p>{c.email ?? "No email"}</p>
              <p className="text-muted-foreground">{c.phone}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3"><p className="text-lg font-semibold tabular-nums">{c.orders}</p><p className="text-xs text-muted-foreground">Orders</p></div>
              <div className="rounded-lg border p-3"><p className="text-lg font-semibold tabular-nums">{c.activeOrders}</p><p className="text-xs text-muted-foreground">Active</p></div>
              <div className="rounded-lg border p-3"><p className="text-lg font-semibold tabular-nums">{kes(c.totalSpent)}</p><p className="text-xs text-muted-foreground">Delivered</p></div>
            </div>
            <Separator />

            {(blocking.length > 0 || (c.status === "active" && activeOrders.length > 0)) && (
              <div role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" /> {blocking.length > 0 ? "Cannot deactivate yet" : "Active orders"}</p>
                <p className="mt-1 text-muted-foreground">Cancel or complete these orders first, then deactivate the account.</p>
                <ul className="mt-2 space-y-1">
                  {(blocking.length > 0 ? blocking : activeOrders).map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2">
                      <span>{o.number ?? o.id.slice(0, 8)} <StatusBadge value={o.status} /></span>
                      <Link className="text-primary underline underline-offset-4" to={`/orders?q=${encodeURIComponent(o.number ?? "")}`}>Open order</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c.addresses.length > 0 && (
              <div>
                <p className="mb-2 font-medium">Delivery places</p>
                <ul className="divide-y rounded-lg border">
                  {c.addresses.map((a) => (
                    <li key={a.id} className="p-3">
                      <p className="font-medium">{a.label}{a.isDefault && <span className="ml-2 text-xs font-normal text-muted-foreground">Default</span>}</p>
                      <p className="text-muted-foreground">{a.street}, {a.area}, {a.county}</p>
                      {(a.recipient || a.phone) && <p className="text-xs text-muted-foreground">{[a.recipient, a.phone].filter(Boolean).join(" · ")}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-2 font-medium">Orders</p>
              {c.orderList.length === 0 ? (
                <p className="text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {c.orderList.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 p-3">
                      <span>
                        <Link className="font-medium hover:underline" to={`/orders?q=${encodeURIComponent(o.number ?? "")}`}>{o.number}</Link>
                        <span className="block text-xs text-muted-foreground">{dateTime(o.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-3"><StatusBadge value={o.status} /><span className="tabular-nums">{kes(o.total)}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canWrite && c.hasAccount && (
              <div className="flex justify-end">
                {c.status === "disabled" ? (
                  <Button variant="outline" disabled={activating} onClick={() => void run(activate(c.id), "Account reactivated")}>
                    {activating ? "Reactivating..." : "Reactivate account"}
                  </Button>
                ) : (
                  <ConfirmButton
                    title="Deactivate this account?"
                    description="The customer will be signed out and cannot sign in until you reactivate the account. Their order history is kept."
                    onConfirm={() => void onDeactivate()}
                    trigger={
                      <Button variant="destructive" disabled={deactivating || activeOrders.length > 0}>
                        {deactivating ? "Deactivating..." : "Deactivate account"}
                      </Button>
                    }
                  />
                )}
              </div>
            )}
            {!c.hasAccount && <p className="text-muted-foreground">This customer ordered without an account, so there is nothing to deactivate.</p>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
