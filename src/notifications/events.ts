export type Tone = "success" | "info" | "alert";

/** What the server pushes to staff about an order. */
export interface OrderEvent {
  id: string;
  kind: "order.created" | "order.status";
  orderId: string;
  number: string;
  status: string;
  previousStatus?: string;
  total: number;
  method: "delivery" | "pickup";
  paymentMethod: string;
  customerName: string;
  at: number;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  tone: Tone;
  number: string;
  at: number;
  read: boolean;
}

const kes = (n: number): string => `KES ${n.toLocaleString("en-KE")}`;

const STATUS_TITLE: Record<string, { title: string; tone: Tone }> = {
  pending: { title: "back to pending", tone: "info" },
  paid: { title: "paid", tone: "success" },
  packed: { title: "packed", tone: "info" },
  shipped: { title: "shipped", tone: "info" },
  delivered: { title: "delivered", tone: "success" },
  cancelled: { title: "cancelled", tone: "alert" },
  refunded: { title: "refunded", tone: "alert" },
};

/** Text for the bell and the pop-up. */
export function noticeFor(e: OrderEvent): Notice {
  if (e.kind === "order.created") {
    return {
      id: e.id,
      title: `New order ${e.number}`,
      body: `${e.customerName} · ${kes(e.total)} · ${e.method === "pickup" ? "pickup" : "delivery"} · ${e.paymentMethod.toUpperCase()}`,
      tone: "success",
      number: e.number,
      at: e.at,
      read: false,
    };
  }
  const s = STATUS_TITLE[e.status] ?? { title: e.status, tone: "info" as Tone };
  return {
    id: e.id,
    title: `Order ${e.number} ${s.title}`,
    body: `${e.customerName} · ${kes(e.total)}${e.previousStatus ? ` · was ${e.previousStatus}` : ""}`,
    tone: s.tone,
    number: e.number,
    at: e.at,
    read: false,
  };
}

/** Validates the JSON of an `order` event. */
export function parseOrderEvent(raw: string): OrderEvent | null {
  try {
    const v = JSON.parse(raw) as Partial<OrderEvent> | null;
    if (!v || typeof v !== "object") return null;
    if (typeof v.id !== "string" || typeof v.number !== "string" || typeof v.status !== "string" || typeof v.total !== "number" || typeof v.at !== "number") return null;
    if (v.kind !== "order.created" && v.kind !== "order.status") return null;
    return {
      id: v.id,
      kind: v.kind,
      orderId: String(v.orderId ?? ""),
      number: v.number,
      status: v.status,
      previousStatus: v.previousStatus,
      total: v.total,
      method: v.method === "pickup" ? "pickup" : "delivery",
      paymentMethod: String(v.paymentMethod ?? ""),
      customerName: String(v.customerName ?? "A customer"),
      at: v.at,
    };
  } catch {
    return null;
  }
}
