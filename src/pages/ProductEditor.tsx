import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAddVariantMutation, useCreateProductMutation, useDeleteVariantMutation, useGetCategoriesQuery, useGetColoursQuery, useGetProductQuery, useSetProductImagesMutation, useUpdateProductMutation } from "@/api/catalogue";
import { useLazyGetMediaQuery } from "@/api/operations";
import type { Gender, ProductDetail, ProductStatus } from "@/api/types";
import { useCan } from "@/store/hooks";
import { ConfirmButton, run } from "@/components/shared";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  gender: z.enum(["men", "women"]),
  categoryId: z.string().min(1, "Choose a category"),
  blurb: z.string().optional(),
  basePrice: z.coerce.number().int().min(1, "Enter a price"),
  compareAtPrice: z.union([z.literal(""), z.coerce.number().int().min(1)]).optional(),
  status: z.enum(["draft", "active", "archived"]),
  isNew: z.boolean(),
  isBestseller: z.boolean(),
  sizes: z.string().optional(),
  initialStock: z.coerce.number().int().min(0).optional(),
});
type Values = z.input<typeof schema>;

const err = (m?: string) => (m ? <p className="text-sm text-destructive">{m}</p> : null);

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const canWrite = useCan("product:write");
  const { data: product, isLoading } = useGetProductQuery(id!, { skip: isNew });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: colours = [] } = useGetColoursQuery();
  const [create, { isLoading: creating }] = useCreateProductMutation();
  const [update, { isLoading: saving }] = useUpdateProductMutation();
  const [colourIds, setColourIds] = useState<string[]>([]);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", gender: "men", categoryId: "", blurb: "", basePrice: 0, compareAtPrice: "", status: "draft", isNew: false, isBestseller: false, sizes: "S, M, L, XL", initialStock: 10 },
  });
  const gender = watch("gender") as Gender;

  useEffect(() => {
    if (!product) return;
    reset({
      name: product.name,
      gender: product.gender,
      categoryId: product.category?.id ?? product.categoryId ?? "",
      blurb: product.blurb ?? "",
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice ?? "",
      status: product.status,
      isNew: product.isNew,
      isBestseller: product.isBestseller,
    });
    setColourIds(product.colours?.map((c) => c.id) ?? []);
  }, [product, reset]);

  const onSubmit = async (raw: Values) => {
    const v = schema.parse(raw);
    const compareAtPrice = v.compareAtPrice === "" || v.compareAtPrice == null ? undefined : v.compareAtPrice;
    if (isNew) {
      const sizes = (v.sizes ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const r = await run(
        create({ name: v.name, gender: v.gender, categoryId: v.categoryId, blurb: v.blurb || undefined, basePrice: v.basePrice, compareAtPrice, status: v.status, isNew: v.isNew, isBestseller: v.isBestseller, colourIds, sizes, initialStock: v.initialStock }),
        "Product created",
      );
      if (r) navigate(`/products/${(r as ProductDetail).id}`, { replace: true });
    } else {
      await run(
        update({ id: id!, body: { name: v.name, gender: v.gender, categoryId: v.categoryId, blurb: v.blurb || undefined, basePrice: v.basePrice, compareAtPrice, status: v.status as ProductStatus, isNew: v.isNew, isBestseller: v.isBestseller, colourIds } }),
        "Product saved",
      );
    }
  };

  if (!isNew && isLoading) return <Skeleton className="h-96" />;
  const cats = categories.filter((c) => c.gender === gender);

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/products">
            <ArrowLeft /> Products
          </Link>
        </Button>
      </div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{isNew ? "New product" : product?.name}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3" noValidate>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {err(errors.name?.message)}
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Controller control={control} name="gender" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller control={control} name="categoryId" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {err(errors.categoryId?.message)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">Price (KES)</Label>
              <Input id="basePrice" type="number" min={1} {...register("basePrice")} />
              {err(errors.basePrice?.message)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAt">Compare-at price (KES)</Label>
              <Input id="compareAt" type="number" min={1} placeholder="Optional" {...register("compareAtPrice")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="blurb">Description</Label>
              <Textarea id="blurb" rows={3} {...register("blurb")} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              <Controller control={control} name="isNew" render={({ field }) => (
                <label className="flex items-center justify-between text-sm">
                  Mark as new <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </label>
              )} />
              <Controller control={control} name="isBestseller" render={({ field }) => (
                <label className="flex items-center justify-between text-sm">
                  Bestseller <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </label>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colours</CardTitle>
              <CardDescription>Which swatches this product comes in.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {colours.map((c) => {
                const on = colourIds.includes(c.id);
                return (
                  <button key={c.id} type="button" aria-pressed={on} onClick={() => setColourIds((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/10" : "text-muted-foreground"}`}>
                    <span className="size-3 rounded-full border" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {isNew && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Variants</CardTitle>
              <CardDescription>A variant is created for each selected colour and size.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sizes">Sizes (comma separated)</Label>
                <Input id="sizes" {...register("sizes")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Initial stock per variant</Label>
                <Input id="stock" type="number" min={0} {...register("initialStock")} />
              </div>
            </CardContent>
          </Card>
        )}

        {canWrite && (
          <div className="flex gap-2 lg:col-span-3">
            <Button type="submit" disabled={creating || saving}>
              {creating || saving ? "Saving..." : isNew ? "Create product" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/products")}>
              Cancel
            </Button>
          </div>
        )}
      </form>

      {!isNew && product && canWrite && (
        <div className="mt-6 grid gap-4">
          <VariantsCard product={product} colours={colours} />
          <ImagesCard product={product} />
        </div>
      )}
    </>
  );
}

function VariantsCard({ product, colours }: { product: ProductDetail; colours: { id: string; name: string }[] }) {
  const [addVariant, { isLoading }] = useAddVariantMutation();
  const [deleteVariant] = useDeleteVariantMutation();
  const [colourId, setColourId] = useState("");
  const [size, setSize] = useState("");
  const [stock, setStock] = useState("0");
  const own = colours.filter((c) => product.colours?.some((x) => x.id === c.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Variants and stock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Colour</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                  <TableCell>{v.colourName}</TableCell>
                  <TableCell>{v.size}</TableCell>
                  <TableCell className="text-right tabular-nums">{v.available}</TableCell>
                  <TableCell>
                    <ConfirmButton
                      title="Delete this variant?"
                      description={`${v.sku} will no longer be sold.`}
                      onConfirm={() => run(deleteVariant({ id: v.id, productId: product.id }), "Variant deleted")}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={`Delete ${v.sku}`}>
                          <Trash2 />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!colourId || !size.trim()) return;
            await run(addVariant({ productId: product.id, body: { colourId, size: size.trim(), initialStock: Number(stock) || 0 } }), "Variant added");
            setSize("");
          }}
        >
          <div className="w-40 space-y-1">
            <Label>Colour</Label>
            <Select value={colourId} onValueChange={setColourId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Colour" /></SelectTrigger>
              <SelectContent>
                {own.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28 space-y-1">
            <Label htmlFor="vsize">Size</Label>
            <Input id="vsize" value={size} onChange={(e) => setSize(e.target.value)} />
          </div>
          <div className="w-24 space-y-1">
            <Label htmlFor="vstock">Stock</Label>
            <Input id="vstock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={isLoading || !colourId}>
            <Plus /> Add variant
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ImagesCard({ product }: { product: ProductDetail }) {
  const [setImages, { isLoading }] = useSetProductImagesMutation();
  const [loadMedia, { data: media, isFetching }] = useLazyGetMediaQuery();
  const [picker, setPicker] = useState<{ colourId: string | null } | null>(null);
  const images = (product.images ?? []).map((i) => ({ mediaId: i.mediaId, colourId: i.colourId, alt: i.alt ?? undefined, url: i.url }));

  const save = (next: typeof images) => run(setImages({ productId: product.id, images: next.map(({ mediaId, colourId, alt }) => ({ mediaId, colourId, alt })) }), "Images updated");
  const groups: { colourId: string | null; label: string }[] = [{ colourId: null, label: "Shared (shown for every colour without its own photos)" }, ...(product.colours ?? []).map((c) => ({ colourId: c.id, label: c.name }))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Images by colour</CardTitle>
        <CardDescription>The storefront shows the selected colour's photos, or the shared ones if that colour has none.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((g) => {
          const own = images.filter((i) => i.colourId === g.colourId);
          return (
            <div key={g.colourId ?? "shared"}>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                {g.label}
                {g.colourId && !own.length && <Badge variant="outline" className="font-normal text-amber-600">No photos</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                {own.map((i) => (
                  <div key={i.mediaId} className="group relative">
                    <img src={i.url} alt={i.alt ?? ""} className="size-20 rounded-md border object-cover" />
                    <button type="button" aria-label="Remove image" disabled={isLoading} onClick={() => save(images.filter((x) => !(x.mediaId === i.mediaId && x.colourId === g.colourId)))} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-destructive text-white opacity-90 hover:opacity-100">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => { setPicker({ colourId: g.colourId }); loadMedia({ pageSize: 40 }); }} className="grid size-20 place-items-center rounded-md border border-dashed text-muted-foreground hover:bg-muted" aria-label={`Add image for ${g.label}`}>
                  <ImagePlus className="size-5" />
                </button>
              </div>
            </div>
          );
        })}
      </CardContent>

      <Dialog open={!!picker} onOpenChange={(o) => !o && setPicker(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose an image</DialogTitle>
            <DialogDescription>Pick from the media library. Upload new files on the Media page.</DialogDescription>
          </DialogHeader>
          {isFetching ? (
            <Skeleton className="h-60" />
          ) : (
            <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {media?.items.map((m) => (
                <button key={m.id} type="button" className="overflow-hidden rounded-md border hover:ring-2 hover:ring-primary" onClick={async () => {
                  const target = picker!.colourId;
                  setPicker(null);
                  await save([...images, { mediaId: m.id, colourId: target, alt: m.alt ?? product.name, url: m.url }]);
                }}>
                  <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
