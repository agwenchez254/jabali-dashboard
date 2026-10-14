import { useRef, useState } from "react";
import { Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteMediaMutation, useGetMediaQuery, useUploadMediaMutation } from "@/api/operations";
import { errorMessage } from "@/api/baseApi";
import { useCan } from "@/store/hooks";
import { ConfirmButton, Empty, PageHeader, Pager, TableSkeleton, run, useDebounced } from "@/components/shared";

export default function Media() {
  const canWrite = useCan("media:write");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, isFetching } = useGetMediaQuery({ q: dq || undefined, page, pageSize: 24 });
  const [upload, { isLoading: uploading }] = useUploadMediaMutation();
  const [remove] = useDeleteMediaMutation();
  const input = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await upload({ file, alt: file.name.replace(/\.[^.]+$/, "") }).unwrap();
        toast.success(`Uploaded ${file.name}`);
      } catch (e) {
        toast.error(`${file.name}: ${errorMessage(e)}`);
      }
    }
    if (input.current) input.current.value = "";
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
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or alt text" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>No images yet.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.items.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border bg-card">
              <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="flex items-center justify-between gap-1 p-2 text-xs">
                <span className="truncate text-muted-foreground">{m.alt ?? "No alt text"}</span>
                {m.inUse && <Badge variant="outline" className="shrink-0">In use</Badge>}
              </div>
              {canWrite && !m.inUse && (
                <ConfirmButton
                  title="Delete this image?"
                  description="It will be removed from the library."
                  onConfirm={() => run(remove(m.id), "Image deleted")}
                  trigger={
                    <Button variant="secondary" size="icon" className="absolute right-2 top-2 size-7 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100" aria-label="Delete image">
                      <Trash2 />
                    </Button>
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
      {data && <Pager page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />}
    </>
  );
}
