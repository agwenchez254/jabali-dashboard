import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAuditQuery } from "@/api/operations";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader, Pager, TableSkeleton } from "@/components/shared";

export default function Audit() {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetAuditQuery({ page, pageSize: 25 });
  return (
    <>
      <PageHeader title="Audit log" description="Every change made in the dashboard." />
      {isFetching && !data ? (
        <TableSkeleton />
      ) : !data?.items.length ? (
        <Empty>Nothing recorded yet.</Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{dateTime(a.at)}</TableCell>
                  <TableCell>{a.actor?.name ?? "System"}</TableCell>
                  <TableCell className="font-mono text-xs">{a.action.replace("/api/v1/admin/", "")}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{a.entity}</TableCell>
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
