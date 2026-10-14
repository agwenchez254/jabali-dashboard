import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTestimonialMutation, useDeleteTestimonialMutation, useGetTestimonialsQuery, useUpdateTestimonialMutation } from "@/api/content";
import type { Gender, Testimonial } from "@/api/types";
import { useCan } from "@/store/hooks";
import { initials } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, TableSkeleton, run } from "@/components/shared";

const ANY = "any";

export default function Testimonials() {
  const canWrite = useCan("content:write");
  const { data, isFetching } = useGetTestimonialsQuery();
  const [update] = useUpdateTestimonialMutation();
  const [remove] = useDeleteTestimonialMutation();
  const [editing, setEditing] = useState<Testimonial | "new" | null>(null);

  return (
    <>
      <PageHeader title="Testimonials" description="Reviews shown in the storefront carousel.">
        {canWrite && (
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add testimonial
          </Button>
        )}
      </PageHeader>
      {isFetching && !data ? (
        <TableSkeleton rows={4} />
      ) : !data?.length ? (
        <Empty>No testimonials yet.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((t) => (
            <div key={t.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex items-start gap-3">
                <Avatar>
                  {t.avatar?.url && <AvatarImage src={t.avatar.url} alt="" />}
                  <AvatarFallback>{initials(t.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}{t.gender ? ` · ${t.gender}` : ""}</p>
                </div>
                <span className="flex items-center gap-1 text-sm tabular-nums"><Star className="size-3.5 fill-current" />{t.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-auto flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={t.isPublished} disabled={!canWrite} onCheckedChange={(c) => run(update({ id: t.id, body: { isPublished: c } }), c ? "Published" : "Unpublished")} />
                  Published
                </label>
                {canWrite && (
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => setEditing(t)}><Pencil /></Button>
                    <ConfirmButton title={`Delete ${t.name}'s testimonial?`} description="It will be removed from the site." onConfirm={() => run(remove(t.id), "Testimonial deleted")} trigger={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Delete"><Trash2 /></Button>} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>{editing && <TestimonialForm key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}</DialogContent>
      </Dialog>
    </>
  );
}

function TestimonialForm({ item, onClose }: { item: Testimonial | null; onClose: () => void }) {
  const [create, { isLoading: c }] = useCreateTestimonialMutation();
  const [update, { isLoading: u }] = useUpdateTestimonialMutation();
  const [name, setName] = useState(item?.name ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [quote, setQuote] = useState(item?.quote ?? "");
  const [rating, setRating] = useState(String(item?.rating ?? 5));
  const [gender, setGender] = useState<string>(item?.gender ?? ANY);
  const [published, setPublished] = useState(item?.isPublished ?? true);

  const submit = async () => {
    const body = { name: name.trim(), location: location.trim() || undefined, quote: quote.trim(), rating: Math.min(5, Math.max(1, Number(rating) || 5)), gender: gender === ANY ? undefined : (gender as Gender), isPublished: published };
    const ok = item ? await run(update({ id: item.id, body }), "Testimonial saved") : await run(create(body), "Testimonial added");
    if (ok) onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item ? "Edit testimonial" : "Add testimonial"}</DialogTitle>
        <DialogDescription>Only use reviews from real customers.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="tname">Name</Label><Input id="tname" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="tloc">Location</Label><Input id="tloc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nakuru" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="tquote">Quote</Label><Textarea id="tquote" rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="trating">Rating (1 to 5)</Label><Input id="trating" type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Show on</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Both sections</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center justify-between text-sm sm:col-span-2">Published <Switch checked={published} onCheckedChange={setPublished} /></label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={c || u || !name.trim() || quote.trim().length < 5}>{c || u ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </>
  );
}
