import { Ban, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared";
import { dateTime, kes } from "@/lib/format";
import { buildProgress } from "@/lib/orderProgress";

interface Props {
  order: {
    status: string;
    paymentMethod: string;
    total: number;
    events?: { id: string; type: string; note?: string | null; at?: string; createdAt?: string }[];
  };
  canWrite: boolean;
  canRefund: boolean;
  busy: boolean;
  onMove: (to: string) => void;
  onRefund: () => void;
}

/** Button text for moving an order into each status. */
const ACTION: Record<string, string> = {
  paid: "Mark as paid",
  packed: "Mark as packed",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
};

const CAN_CANCEL = ["pending", "paid", "packed"];
// The server only allows a refund once the order is paid or delivered.
const CAN_REFUND = ["paid", "delivered"];

/**
 * Where an order is in its life, the next thing to do, and the full activity log.
 * Finished steps are ticked, the current step is ringed, and what is still to come is dashed.
 */
export function OrderProgress({ order, canWrite, canRefund, busy, onMove, onRefund }: Props) {
  const p = buildProgress(order);
  const events = order.events ?? [];
  const nextLabel = p.next ? (p.next === "delivered" && order.paymentMethod === "cod" ? "Mark as delivered and paid" : ACTION[p.next]) : null;
  const showCancel = canWrite && CAN_CANCEL.includes(order.status);
  const showRefund = canRefund && CAN_REFUND.includes(order.status);

  return (
    <section aria-label="Order progress">
      <h3 className="text-sm font-medium">Progress</h3>

      <ol className="mt-4">
        {p.steps.map((s, i) => {
          const last = i === p.steps.length - 1 && !p.terminal;
          return (
            <li key={s.key} className="relative flex gap-3 pb-6 last:pb-0" aria-current={s.state === "current" ? "step" : undefined}>
              {!last && <span aria-hidden className={`absolute left-[11px] top-6 bottom-0 w-px ${s.state === "done" ? "bg-foreground" : "bg-border"}`} />}
              <span
                aria-hidden
                className={`relative grid size-6 shrink-0 place-items-center rounded-full ${
                  s.state === "done"
                    ? "bg-foreground text-background"
                    : s.state === "current"
                      ? "border-2 border-foreground bg-background"
                      : "border border-dashed border-muted-foreground/60 bg-background"
                }`}
              >
                {s.state === "done" && <Check className="size-3.5" strokeWidth={3} />}
                {s.state === "current" && <span className="size-2 rounded-full bg-foreground" />}
              </span>
              <div className="min-w-0 flex-1 pt-px">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={s.state === "upcoming" ? "text-muted-foreground" : "font-medium"}>{s.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.at ? dateTime(s.at) : s.state === "current" ? "Now" : ""}</span>
                </div>
                {s.state === "current" && canWrite && nextLabel && p.next && (
                  <Button size="sm" className="mt-2" disabled={busy} onClick={() => onMove(p.next!)}>
                    {nextLabel}
                  </Button>
                )}
              </div>
            </li>
          );
        })}

        {p.terminal && (
          <li className="relative flex gap-3 pt-6" aria-current="step">
            <span aria-hidden className="absolute -top-0 left-[11px] h-6 w-px bg-foreground" />
            <span aria-hidden className="relative grid size-6 shrink-0 place-items-center rounded-full bg-destructive text-white">
              {p.terminal.key === "cancelled" ? <X className="size-3.5" strokeWidth={3} /> : <RotateCcw className="size-3.5" strokeWidth={3} />}
            </span>
            <div className="min-w-0 flex-1 pt-px">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-destructive">{p.terminal.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{p.terminal.at ? dateTime(p.terminal.at) : ""}</span>
              </div>
              {p.terminal.note && <p className="mt-0.5 text-muted-foreground">{p.terminal.note}</p>}
            </div>
          </li>
        )}
      </ol>

      {(showCancel || showRefund) && (
        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
          {showCancel && (
            <ConfirmButton
              title="Cancel this order?"
              description="The order is cancelled and its stock is released. This cannot be undone."
              onConfirm={() => onMove("cancelled")}
              trigger={
                <Button size="sm" variant="outline" disabled={busy}>
                  <Ban /> Cancel order
                </Button>
              }
            />
          )}
          {showRefund && (
            <ConfirmButton
              title="Refund this order?"
              description={`This refunds ${kes(order.total)} and releases the order.`}
              onConfirm={onRefund}
              trigger={
                <Button size="sm" variant="outline" className="text-destructive" disabled={busy}>
                  <RotateCcw /> Refund
                </Button>
              }
            />
          )}
        </div>
      )}

      {events.length > 0 && (
        <details className="mt-5 text-muted-foreground">
          <summary className="cursor-pointer text-sm font-medium text-foreground">Activity log ({events.length})</summary>
          <ol className="mt-3 space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span>
                  <span className="capitalize">{e.type.replace("status:", "").replace("_", " ")}</span>
                  {e.note ? `: ${e.note}` : ""}
                </span>
                <span className="shrink-0 text-xs tabular-nums">{dateTime(e.at ?? e.createdAt)}</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
