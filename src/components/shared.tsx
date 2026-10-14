import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { errorMessage } from "@/api/baseApi";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const tone: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  draft: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  packed: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  shipped: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
  refunded: "bg-red-500/15 text-red-700 dark:text-red-400",
  expired: "bg-muted text-muted-foreground",
  paused: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${tone[value] ?? "bg-muted text-muted-foreground"}`}>
      {value.replace("_", " ")}
    </Badge>
  );
}

export function Pager({ page, pageCount, total, onPage }: { page: number; pageCount: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 pt-4 text-sm text-muted-foreground">
      <span>{total} results</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="tabular-nums">
          {page} / {Math.max(pageCount, 1)}
        </span>
        <Button variant="outline" size="icon" className="size-8" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">{children}</p>;
}

export function ConfirmButton({ children, title, description, onConfirm, trigger }: { children?: ReactNode; title: string; description: string; onConfirm: () => void; trigger: ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Runs an RTK Query mutation promise and shows a toast either way. */
export async function run<T>(p: { unwrap: () => Promise<T> }, success: string): Promise<T | undefined> {
  try {
    const r = await p.unwrap();
    toast.success(success);
    return r;
  } catch (e) {
    toast.error(errorMessage(e));
    return undefined;
  }
}
