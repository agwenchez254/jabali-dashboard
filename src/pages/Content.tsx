import { useState } from "react";
import { History, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBlockMutation, useDeleteBlockMutation, useGetBlocksQuery, useLazyGetBlockPreviewQuery, useLazyGetBlockVersionsQuery, usePublishBlockMutation, useRollbackBlockMutation, useScheduleBlockMutation, useUnpublishBlockMutation, useUpdateBlockMutation } from "@/api/content";
import type { BlockKind, ContentBlock, Gender } from "@/api/types";
import { useCan } from "@/store/hooks";
import { dateTime, toLocalInput } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, StatusBadge, TableSkeleton, run } from "@/components/shared";

const KINDS: BlockKind[] = ["hero", "banner", "testimonial_set", "category_tiles", "rich_text", "faq", "gift_promo"];
const ANY = "any";

export default function Content() {
  const canWrite = useCan("content:write");
  const [kind, setKind] = useState(ANY);
  const { data, isFetching } = useGetBlocksQuery({ kind: kind === ANY ? undefined : kind });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ContentBlock | null>(null);

  return (
    <>
      <PageHeader title="Site content" description="Hero, banners and other blocks shown on the storefront. Edits stay as drafts until published.">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All block types</SelectItem>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k} className="capitalize">{k.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus /> New block
          </Button>
        )}
      </PageHeader>

      {isFetching && !data ? (
        <TableSkeleton rows={5} />
      ) : !data?.length ? (
        <Empty>No content blocks.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((b) => (
            <button key={b.id} onClick={() => setEditing(b)} className="rounded-lg border bg-card p-4 text-left transition hover:bg-muted/50">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-sm">{b.key}</span>
                <StatusBadge value={b.scheduled ? "scheduled" : b.live ? "live" : b.status} />
              </div>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {b.kind.replace("_", " ")}{b.gender ? ` · ${b.gender}` : ""} · v{b.version} · {dateTime(b.updatedAt)}
              </p>
              {b.hasUnpublishedChanges && <Badge variant="outline" className="mt-2 text-amber-600">Unpublished changes</Badge>}
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{JSON.stringify(b.effective)}</p>
            </button>
          ))}
        </div>
      )}

      <CreateDialog open={creating} onClose={() => setCreating(false)} />
      <BlockSheet block={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function CreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [create, { isLoading }] = useCreateBlockMutation();
  const [key, setKey] = useState("");
  const [kind, setKind] = useState<BlockKind>("banner");
  const [gender, setGender] = useState<string>(ANY);
  const [json, setJson] = useState("{\n  \n}");

  const submit = async () => {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(json);
    } catch {
      toast.error("Content must be valid JSON");
      return;
    }
    if (await run(create({ key: key.trim(), kind, gender: gender === ANY ? undefined : (gender as Gender), data }), "Block created")) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New content block</DialogTitle>
          <DialogDescription>Keys look like home.banner.sale and are read by the storefront.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="bkey">Key</Label><Input id="bkey" value={key} onChange={(e) => setKey(e.target.value)} placeholder="home.banner.sale" /></div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as BlockKind)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Both</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="bjson">Content (JSON)</Label><Textarea id="bjson" rows={7} className="font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={isLoading || key.trim().length < 3}>{isLoading ? "Creating..." : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlockSheet({ block, onClose }: { block: ContentBlock | null; onClose: () => void }) {
  return (
    <Sheet open={!!block} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{block && <BlockEditor key={block.id + block.version + String(block.updatedAt)} block={block} onClose={onClose} />}</SheetContent>
    </Sheet>
  );
}

function BlockEditor({ block, onClose }: { block: ContentBlock; onClose: () => void }) {
  const canWrite = useCan("content:write");
  const canPublish = useCan("content:publish");
  const [update, { isLoading: saving }] = useUpdateBlockMutation();
  const [publish] = usePublishBlockMutation();
  const [unpublish] = useUnpublishBlockMutation();
  const [schedule] = useScheduleBlockMutation();
  const [rollback] = useRollbackBlockMutation();
  const [remove] = useDeleteBlockMutation();
  const [loadVersions, { data: versions, isFetching: loadingV }] = useLazyGetBlockVersionsQuery();
  const [loadPreview, { data: preview, isFetching: loadingP }] = useLazyGetBlockPreviewQuery();
  const [json, setJson] = useState(JSON.stringify(block.draftData ?? block.data, null, 2));
  const [publishAt, setPublishAt] = useState(toLocalInput(block.publishAt));

  const parse = () => {
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      toast.error("Content must be valid JSON");
      return null;
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-mono text-base">{block.key}</SheetTitle>
        <SheetDescription className="capitalize">{block.kind.replace("_", " ")} · version {block.version}</SheetDescription>
      </SheetHeader>
      <div className="space-y-4 px-4 pb-6">
        <div className="space-y-2">
          <Label htmlFor="edit-json">Draft content (JSON)</Label>
          <Textarea id="edit-json" rows={12} className="font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} readOnly={!canWrite} />
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <Button variant="outline" disabled={saving} onClick={() => { const data = parse(); if (data) run(update({ id: block.id, body: { data } }), "Draft saved"); }}>
              Save draft
            </Button>
          )}
          <Button variant="outline" disabled={loadingP} onClick={() => loadPreview(block.id)}>Preview</Button>
          {canPublish && (
            <Button onClick={async () => { const data = parse(); if (!data) return; if (canWrite && (await run(update({ id: block.id, body: { data } }), "Draft saved")) === undefined) return; run(publish({ id: block.id }), "Published"); }}>
              <Send /> Publish
            </Button>
          )}
          {canPublish && block.live && (
            <Button variant="outline" onClick={() => run(unpublish(block.id), "Unpublished")}>Unpublish</Button>
          )}
        </div>

        {preview !== undefined && (
          <pre className="max-h-48 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">{JSON.stringify(preview, null, 2)}</pre>
        )}

        {canPublish && (
          <>
            <Separator />
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="sched">Publish at</Label>
                <Input id="sched" type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
              </div>
              <Button variant="outline" disabled={!publishAt} onClick={() => run(schedule({ id: block.id, publishAt: new Date(publishAt).toISOString() }), "Scheduled")}>Schedule</Button>
            </div>
          </>
        )}

        <Separator />
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => loadVersions(block.id)}>
            <History /> {versions ? "Refresh history" : "Show version history"}
          </Button>
          {loadingV && <p className="py-2 text-sm text-muted-foreground">Loading...</p>}
          {versions && (
            <ul className="mt-2 divide-y text-sm">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 py-2">
                  <span>v{v.version}<span className="ml-2 text-xs text-muted-foreground">{dateTime(v.createdAt)}</span></span>
                  {canPublish && (
                    <ConfirmButton title={`Roll back to v${v.version}?`} description="This publishes that version again." onConfirm={() => run(rollback({ id: block.id, version: v.version }), "Rolled back")} trigger={<Button size="sm" variant="outline">Roll back</Button>} />
                  )}
                </li>
              ))}
              {!versions.length && <li className="py-2 text-muted-foreground">No earlier versions.</li>}
            </ul>
          )}
        </div>

        {canWrite && (
          <>
            <Separator />
            <ConfirmButton title={`Delete ${block.key}?`} description="The block and its history are removed." onConfirm={async () => { if (await run(remove(block.id), "Block deleted")) onClose(); }} trigger={<Button variant="outline" className="text-destructive"><Trash2 /> Delete block</Button>} />
          </>
        )}
      </div>
    </>
  );
}
