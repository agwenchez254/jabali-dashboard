import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Banknote, PackageCheck, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAnalyticsSummaryQuery } from "@/api/operations";
import { useGetOrdersQuery } from "@/api/orders";
import { useAppSelector } from "@/store/hooks";
import { dateTime, kes } from "@/lib/format";
import { Empty, PageHeader, StatusBadge } from "@/components/shared";

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: typeof Banknote }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const canOrders = user?.permissions.includes("order:read");
  const { data, isLoading } = useGetAnalyticsSummaryQuery();
  const { data: recent } = useGetOrdersQuery({ pageSize: 6 }, { skip: !canOrders });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const pending = data.ordersByStatus.pending + data.ordersByStatus.paid;
  const chart = data.revenueByDay.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) }));

  return (
    <>
      <PageHeader title={`Welcome back${user ? ", " + user.name.split(" ")[0] : ""}`} description="Here is how the store is doing." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue today" value={kes(data.sales.today.revenue)} sub={`${data.sales.today.orders} orders`} icon={Banknote} />
        <Stat label="Last 7 days" value={kes(data.sales.last7Days.revenue)} sub={`${data.sales.last7Days.orders} orders`} icon={ShoppingCart} />
        <Stat label="Last 30 days" value={kes(data.sales.last30Days.revenue)} sub={`${data.sales.last30Days.orders} orders`} icon={PackageCheck} />
        <Stat label="Needs attention" value={String(pending)} sub={`${data.lowStock?.count ?? 0} low-stock variants`} icon={AlertTriangle} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue, last 30 days</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip formatter={(v) => kes(Number(v))} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.ordersByStatus).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <StatusBadge value={k} />
                <span className="tabular-nums">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {!recent?.items.length ? (
              <Empty>No orders yet.</Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.items.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link to="/orders" className="font-medium hover:underline">
                          {o.number}
                        </Link>
                        <p className="text-xs text-muted-foreground">{dateTime(o.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={o.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{kes(o.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low stock</CardTitle>
            <CardDescription>Variants at or below their threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {!data.lowStock?.items.length ? (
              <Empty>Everything is well stocked.</Empty>
            ) : (
              <ul className="divide-y">
                {data.lowStock.items.slice(0, 6).map((i) => (
                  <li key={i.variantId} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0">
                      <Link to="/inventory" className="block truncate font-medium hover:underline">
                        {i.productName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {i.colour} · {i.size}
                      </span>
                    </span>
                    <span className="tabular-nums text-destructive">{i.available} left</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
