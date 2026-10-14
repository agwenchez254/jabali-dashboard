import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBulkUpdateProductsMutation, useDeleteProductMutation, useGetCategoriesQuery, useGetProductsQuery } from "@/api/catalogue";
import { useCan } from "@/store/hooks";
import { kes } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, Pager, StatusBadge, TableSkeleton, run, useDebounced } from "@/components/shared";

const ALL = "all";

export default function Products() {
  const canWrite = useCan("product:write");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(ALL);
  const [gender, setGender] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const dq = useDebounced(q);

  const { data, isFetching } = useGetProductsQuery({
    q: dq || undefined,
    status: status === ALL ? undefined : status,
    gender: gender === ALL ? undefined : gender,
    categoryId: categoryId === ALL ? undefined : categoryId,
    page,
    pageSize: 15,
  });
  const { data: categories } = useGetCategoriesQuery();
  const [bulk] = useBulkUpdateProductsMutation();
  const [remove] = useDeleteProductMutation();

  const reset = () => setPage(1);
  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((i) => selected.includes(i.id));

  return (
    <>
      <PageHeader title="Products" description="Everything in your catalogue.">
        {canWrite && (
          <Button asChild>
            <Link to="/products/new">
              <Plus /> New product
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search products" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); reset(); }}>
          <SelectTrigger className="w-full lg:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={(v) => { setGender(v); reset(); }}>
          <SelectTrigger className="w-full lg:w-32"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Men and women</SelectItem>
            <SelectItem value="men">Men</SelectItem>
            <SelectItem value="women">Women</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); reset(); }}>
          <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label} ({c.gender})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canWrite && selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-2 text-sm">
          <span className="px-2">{selected.length} selected</span>
          {(["active", "draft", "archived"] as const).map((s) => (
            <Button key={s} size="sm" variant="outline" className="capitalize" onClick={async () => { await run(bulk({ ids: selected, status: s }), `Marked ${selected.length} as ${s}`); setSelected([]); }}>
              Mark {s}
            </Button>
          ))}
        </div>
      )}

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !items.length ? (
        <Empty>No products match these filters.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {canWrite && (
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={(c) => setSelected(c ? items.map((i) => i.id) : [])} aria-label="Select all" />
                  </TableHead>
                )}
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                {canWrite && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  {canWrite && (
                    <TableCell>
                      <Checkbox checked={selected.includes(p.id)} onCheckedChange={(c) => setSelected((s) => (c ? [...s, p.id] : s.filter((x) => x !== p.id)))} aria-label={`Select ${p.name}`} />
                    </TableCell>
                  )}
                  <TableCell>
                    <Link to={`/products/${p.id}`} className="flex items-center gap-3">
                      {p.image ? <img src={p.image} alt="" className="size-10 rounded-md object-cover" loading="lazy" /> : <span className="size-10 rounded-md bg-muted" />}
                      <span className="min-w-0">
                        <span className="block truncate font-medium hover:underline">{p.name}</span>
                        <span className="text-xs capitalize text-muted-foreground">{p.gender} · {p.variantCount} variants</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{p.category.label}</TableCell>
                  <TableCell>
                    <StatusBadge value={p.status} />
                  </TableCell>
                  <TableCell className={`hidden sm:table-cell text-right tabular-nums ${p.stock.lowStock ? "text-destructive" : ""}`}>{p.stock.available}</TableCell>
                  <TableCell className="text-right tabular-nums">{kes(p.basePrice)}</TableCell>
                  {canWrite && (
                    <TableCell>
                      <ConfirmButton
                        title={`Delete ${p.name}?`}
                        description="The product is removed from the store. Past orders keep their snapshot."
                        onConfirm={() => run(remove(p.id), "Product deleted")}
                        trigger={
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={`Delete ${p.name}`}>
                            <Trash2 />
                          </Button>
                        }
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pager page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />}
    </>
  );
}
