import assert from "node:assert/strict";
import { test } from "node:test";
import { chunk, deleteSummary, uploadFailures, uploadSummary } from "../src/lib/mediaBatch.ts";

test("chunk splits into groups of at most the size", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 20), []);
  assert.equal(chunk(Array.from({ length: 45 }, (_, i) => i), 20).length, 3);
});

test("uploadFailures names the file, falling back to its position in the request", () => {
  const files = [{ name: "a.png" }, { name: "b.png" }];
  const out = uploadFailures(files, [
    { index: 0, filename: "a.png", message: "Only JPEG" },
    { index: 1, filename: "", message: "too big" },
    { index: 7, filename: "", message: "?" },
  ]);
  assert.deepEqual(out.map((f) => f.filename), ["a.png", "b.png", "An image"]);
});

test("summaries read naturally for one, all and some", () => {
  assert.equal(uploadSummary(1, 1), "1 image uploaded");
  assert.equal(uploadSummary(3, 3), "3 images uploaded");
  assert.equal(uploadSummary(2, 5), "2 of 5 images uploaded");
  assert.equal(deleteSummary(4, 4), "4 images deleted");
  assert.equal(deleteSummary(1, 3), "1 of 3 images deleted");
});
