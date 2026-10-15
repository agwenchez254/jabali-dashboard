import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProgress } from "../src/lib/orderProgress.ts";

const ev = (type: string, at: string, note?: string) => ({ type, at, note });
const states = (p: ReturnType<typeof buildProgress>) => p.steps.map((s) => `${s.key}:${s.state}`);

test("a new online order has everything still to come", () => {
  const p = buildProgress({ status: "pending", paymentMethod: "mpesa", events: [ev("created", "2026-10-15T08:00:00Z")] });
  assert.deepEqual(states(p), ["pending:current", "paid:upcoming", "packed:upcoming", "shipped:upcoming", "delivered:upcoming"]);
  assert.equal(p.steps[0].at, "2026-10-15T08:00:00Z");
  assert.equal(p.steps[1].at, null);
  assert.equal(p.next, "paid");
  assert.equal(p.terminal, null);
});

test("earlier steps are done, the current one is marked and the next step is named", () => {
  const p = buildProgress({
    status: "packed",
    paymentMethod: "card",
    events: [ev("created", "t1"), ev("status:paid", "t2"), ev("status:packed", "t3")],
  });
  assert.deepEqual(states(p), ["pending:done", "paid:done", "packed:current", "shipped:upcoming", "delivered:upcoming"]);
  assert.deepEqual(p.steps.map((s) => s.at), ["t1", "t2", "t3", null, null]);
  assert.equal(p.next, "shipped");
});

test("a delivered order is complete with nothing left to do", () => {
  const p = buildProgress({ status: "delivered", paymentMethod: "mpesa", events: [] });
  assert.ok(p.steps.every((s) => s.state === "done"));
  assert.equal(p.next, null);
});

test("pay-on-delivery orders skip the payment step and pay with the delivery", () => {
  const p = buildProgress({ status: "pending", paymentMethod: "cod", events: [ev("created", "t1")] });
  assert.deepEqual(p.steps.map((s) => s.key), ["pending", "packed", "shipped", "delivered"]);
  assert.equal(p.steps[3].label, "Delivered and paid");
  assert.equal(p.next, "packed");
});

test("a cancelled order stops where it stopped and ends in a cancelled state", () => {
  const p = buildProgress({
    status: "cancelled",
    paymentMethod: "mpesa",
    events: [ev("created", "t1"), ev("status:paid", "t2"), ev("status:cancelled", "t3", "Customer asked")],
  });
  assert.deepEqual(states(p), ["pending:done", "paid:done"]);
  assert.deepEqual(p.terminal, { key: "cancelled", label: "Cancelled", at: "t3", note: "Customer asked" });
  assert.equal(p.next, null);
});

test("a refunded order shows its whole journey and then the refund", () => {
  const p = buildProgress({
    status: "refunded",
    paymentMethod: "card",
    events: [ev("created", "t1"), ev("status:paid", "t2"), ev("status:packed", "t3"), ev("status:shipped", "t4"), ev("status:delivered", "t5"), ev("status:refunded", "t6")],
  });
  assert.equal(p.steps.length, 5);
  assert.ok(p.steps.every((s) => s.state === "done"));
  assert.equal(p.terminal?.label, "Refunded");
  assert.equal(p.terminal?.at, "t6");
});

test("an order with no activity log still renders, and a refunded one without events shows only its first step", () => {
  assert.equal(buildProgress({ status: "paid", paymentMethod: "mpesa" }).steps.length, 5);
  const p = buildProgress({ status: "cancelled", paymentMethod: "mpesa", events: [] });
  assert.deepEqual(states(p), ["pending:done"]);
  assert.equal(p.terminal?.at, null);
});

test("the latest event wins when a step was logged twice", () => {
  const p = buildProgress({ status: "paid", paymentMethod: "mpesa", events: [ev("created", "t1"), ev("status:paid", "t2"), ev("status:paid", "t9")] });
  assert.equal(p.steps[1].at, "t9");
});

test("createdAt is used when an event has no at", () => {
  const p = buildProgress({ status: "pending", paymentMethod: "mpesa", events: [{ type: "created", createdAt: "tc" }] });
  assert.equal(p.steps[0].at, "tc");
});
