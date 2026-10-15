/** What the order sheet's progress tracker shows, worked out from the order alone. */

export type StepState = "done" | "current" | "upcoming";

export interface ProgressStep {
  /** The order status this step stands for. */
  key: string;
  label: string;
  state: StepState;
  /** When the order reached this step, if the activity log says so. */
  at: string | null;
}

export interface Terminal {
  key: "cancelled" | "refunded";
  label: string;
  at: string | null;
  note: string | null;
}

export interface Progress {
  steps: ProgressStep[];
  /** Set when the order ended early (cancelled) or was refunded. The steps then stop where the order stopped. */
  terminal: Terminal | null;
  /** The status the next action moves the order to, or null when there is nothing left to do. */
  next: string | null;
}

interface EventLike {
  type: string;
  note?: string | null;
  at?: string;
  createdAt?: string;
}

const FLOW = ["pending", "paid", "packed", "shipped", "delivered"] as const;

const LABELS: Record<string, string> = {
  pending: "Order placed",
  paid: "Payment received",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

const when = (e: EventLike): string | null => e.at ?? e.createdAt ?? null;

/** Pay-on-delivery orders are packed before they are paid, and the payment arrives with the delivery. */
function flowFor(paymentMethod: string): string[] {
  return paymentMethod === "cod" ? FLOW.filter((s) => s !== "paid") : [...FLOW];
}

export function buildProgress(order: { status: string; paymentMethod: string; events?: EventLike[] }): Progress {
  const events = order.events ?? [];
  const flow = flowFor(order.paymentMethod);
  const stamp = (status: string): string | null => {
    const type = status === "pending" ? "created" : `status:${status}`;
    const hits = events.filter((e) => e.type === type);
    const last = hits[hits.length - 1];
    return last ? when(last) : null;
  };
  const label = (status: string) => (status === "delivered" && order.paymentMethod === "cod" ? "Delivered and paid" : (LABELS[status] ?? status));

  const ended = order.status === "cancelled" || order.status === "refunded";
  // How far the order got: the current status, or for an ended order the furthest step its log shows.
  let reached = flow.indexOf(order.status);
  if (ended) {
    reached = 0;
    flow.forEach((s, i) => {
      if (stamp(s) !== null) reached = i;
    });
  }
  const final = reached === flow.length - 1 && !ended;

  const visible = ended ? flow.slice(0, reached + 1) : flow;
  const steps: ProgressStep[] = visible.map((s, i) => ({
    key: s,
    label: label(s),
    at: stamp(s),
    state: ended || final ? "done" : i < reached ? "done" : i === reached ? "current" : "upcoming",
  }));

  let terminal: Terminal | null = null;
  if (ended) {
    const key = order.status as "cancelled" | "refunded";
    const hits = events.filter((e) => e.type === `status:${key}`);
    const last = hits[hits.length - 1];
    terminal = { key, label: key === "cancelled" ? "Cancelled" : "Refunded", at: last ? when(last) : null, note: last?.note ?? null };
  }

  const next = ended || final ? null : (flow[reached + 1] ?? null);
  return { steps, terminal, next };
}
