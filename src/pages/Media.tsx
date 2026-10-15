import { useRef, useState } from "react";
import { Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useDeleteMediaBatchMutation, useDeleteMediaMutation, useGetMediaQuery, useUploadMediaBatchMutation } from "@/api/operations";
import { errorMessage } from "@/api/baseApi";
import { useCan } from "@/store/hooks";
import { ConfirmButton, Empty, PageHeader, Pager, TableSkeleton, run, useDebounced } from "@/components/shared";
import { MAX_BATCH_DELETE, MAX_BATCH_FILES, chunk, deleteSummary, uploadFailures, uploadSummary } from "@/lib/mediaBatch";

export default function Media() {
  const canWrite = useCan("media:write");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const dq = useDebounced(q);
  const { data, isFetching } = useGetMediaQuery({ q: dq || undefined, page, pageSize: 24 });
  const [uploadBatch, { isLoading: uploading }] = useUploadMediaBatchMutation();
  const [remove] = useDeleteMediaMutation();
  const [removeBatch, { isLoading: deleting }] = useDeleteMediaBatchMutation();
  const input = useRef<HTMLInputElement>(null);

  // Images used by a product, category or testimonial cannot be deleted, so they cannot be selected.
  const deletable = (data?.items ?? []).filter((m) => !m.inUse);
  const allSelected = deletable.length > 0 && deletable.every((m) => selected.has(m.id));

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(deletable.map((m) => m.id)));

  /** One request per 20 images instead of one per image. */
  const onFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    let done = 0;
    const failures: { filename: string; message: string }[] = [];
    for (const group of chunk(files, MAX_BATCH_FILES)) {
      try {
        const r = await uploadBatch({ files: group }).unwrap();
        done += r.items.length;
        failures.push(...uploadFailures(group, r.failed));
      } catch (e) {
        // The whole request was refused (every file bad, no permission, network): name the files in it.
        failures.push(...group.map((f) => ({ filename: f.name, message: errorMessage(e) })));
      }
    }
    if (input.current) input.current.value = "";
    if (done > 0) toast.success(uploadSummary(done, files.length));
    if (failures.length === 1) toast.error(`${failures[0].filename}: ${failures[0].message}`);
    else if (failures.length > 1) toast.error(`${failures.length} images failed`, { description: failures.slice(0, 4).map((f) => `${f.filename}: ${f.message}`).join("\n") + (failures.length > 4 ? `\nand ${failures.length - 4} more` : "") });
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    let deleted = 0;
    const failed: { id: string; message: string }[] = [];
    for (const group of chunk(ids, MAX_BATCH_DELETE)) {
      try {
        const r = await removeBatch({ ids: group }).unwrap();
        deleted += r.deleted.length;
        failed.push(...r.failed);
      } catch (e) {
        failed.push(...group.map((id) => ({ id, message: errorMessage(e) })));
      }
    }
    // Keep only what is still there, so a failed image stays selected and can be retried.
    setSelected(new Set(failed.map((f) => f.id)));
    if (deleted > 0) toast.success(deleteSummary(deleted, ids.length));
    if (failed.length > 0) toast.error(`${failed.length} could not be deleted`, { description: failed[0].message });
  };

  return (
    <>
      <PageHeader title="Media" description="Images used across products and content.">
        {canWrite && (
          <>
            <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <Button onClick={() => input.current?.click()} disabled={uploading}>
              <Upload /> {uploading ? "Uploading..." : "Upload"}
            </Button>
          </>
        )}
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or alt text" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        {canWrite && deletable.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all images on this page" />
            Select all on this page
          </label>
        )}
      </div>

      {canWrite && selected.size > 0 && (
        <div role="region" aria-label="Selected images" className="sticky top-2 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm">
          <span className="text-sm font-medium" aria-live="polite">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <X /> Clear
            </Button>
            <ConfirmButton
              title={`Delete ${selected.size} ${selected.size === 1 ? "image" : "images"}?`}
              description="They will be removed from the library. This cannot be undone."
              onConfirm={deleteSelected}
              trigger={
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 /> {deleting ? "Deleting..." : "Delete selected"}
                </Button>
              }
            />
          </div>
        </div>
      )}

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>No images yet.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.items.map((m) => {
            const picked = selected.has(m.id);
            return (
              <div key={m.id} className={`group relative overflow-hidden rounded-lg border bg-card ${picked ? "ring-2 ring-primary" : ""}`}>
                <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                <div className="flex items-center justify-between gap-1 p-2 text-xs">
                  <span className="truncate text-muted-foreground">{m.alt ?? "No alt text"}</span>
                  {m.inUse && <Badge variant="outline" className="shrink-0">In use</Badge>}
                </div>
                {canWrite && !m.inUse && (
                  <>
                    <Checkbox
                      checked={picked}
                      onCheckedChange={() => toggle(m.id)}
                      aria-label={`Select ${m.alt || "image"}`}
                      className={`absolute left-2 top-2 size-5 bg-background transition ${picked ? "" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
                    />
                    <ConfirmButton
                      title="Delete this image?"
                      description="It will be removed from the library."
                      onConfirm={() => { run(remove(m.id), "Image deleted"); setSelected((cur) => { const n = new Set(cur); n.delete(m.id); return n; }); }}
                      trigger={
                        <Button variant="secondary" size="icon" className="absolute right-2 top-2 size-7 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100" aria-label="Delete image">
                          <Trash2 />
                        </Button>
                      }
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {data && <Pager page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />}
    </>
  );
}
