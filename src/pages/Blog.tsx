import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeletePostMutation, useGetPostsQuery, type PostStatus } from "@/api/blog";
import { useCan } from "@/store/hooks";
import { dateTime } from "@/lib/format";
import { ConfirmButton, Empty, PageHeader, Pager, StatusBadge, TableSkeleton, run, useDebounced } from "@/components/shared";

const ALL = "all";

export default function Blog() {
  const canWrite = useCan("blog:write");
  const navigate = useNavigate();
  const [status, setStatus] = useState(ALL);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, isFetching } = useGetPostsQuery({ status: status === ALL ? undefined : (status as PostStatus), q: dq || undefined, page, pageSize: 15 });
  const [remove] = useDeletePostMutation();

  return (
    <>
      <PageHeader title="Blog" description="Posts for the storefront journal. Drafts stay private until you publish them.">
        {canWrite && (
          <Button onClick={() => navigate("/blog/new")}>
            <Plus /> New post
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by title" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All posts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>No posts yet.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                {canWrite && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    // A click on the delete button or another control inside the row is not a click on the row.
                    if ((e.target as HTMLElement).closest("button, a")) return;
                    navigate(`/blog/${p.id}`);
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt="" className="size-12 shrink-0 rounded-md border object-cover" />
                      ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-md border bg-muted text-xs text-muted-foreground">No image</span>
                      )}
                      <span>
                        <Link className="font-medium hover:underline" to={`/blog/${p.id}`}>{p.title}</Link>
                        <span className="block text-xs text-muted-foreground">/blog/{p.slug}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge value={p.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{dateTime(p.updatedAt)}</TableCell>
                  {canWrite && (
                    <TableCell>
                      <ConfirmButton
                        title="Delete this post?"
                        description="The post is removed for good and its address stops working."
                        onConfirm={() => void run(remove(p.id), "Post deleted")}
                        trigger={<Button variant="ghost" size="icon" aria-label={`Delete ${p.title}`}><Trash2 /></Button>}
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
