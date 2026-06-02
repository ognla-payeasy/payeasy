import test from "node:test";
import assert from "node:assert/strict";

import {
  recordTransaction,
  getMetrics,
  getMetricsByType,
  __resetMetrics,
} from "./metrics.ts";

test("metrics: empty state reports zero with 0% failure rate", () => {
  __resetMetrics();
  assert.deepEqual(getMetrics(), {
    total_transactions: 0,
    failed_transactions: 0,
    failure_rate_percent: 0,
  });
});

test("metrics: counts successes and failures across types", () => {
  __resetMetrics();
  recordTransaction("contribute", "success");
  recordTransaction("contribute", "success");
  recordTransaction("contribute", "failure");
  recordTransaction("release", "failure");

  const m = getMetrics();
  assert.equal(m.total_transactions, 4);
  assert.equal(m.failed_transactions, 2);
  assert.equal(m.failure_rate_percent, 50);
});

test("metrics: failure rate is rounded to two decimals", () => {
  __resetMetrics();
  // 1 failure out of 3 → 33.33%
  recordTransaction("contribute", "success");
  recordTransaction("contribute", "success");
  recordTransaction("contribute", "failure");
  assert.equal(getMetrics().failure_rate_percent, 33.33);
});

test("metrics: per-type breakdown is independent", () => {
  __resetMetrics();
  recordTransaction("contribute", "success");
  recordTransaction("release", "failure");
  recordTransaction("release", "failure");

  const byType = getMetricsByType();
  assert.deepEqual(byType.contribute, {
    total_transactions: 1,
    failed_transactions: 0,
    failure_rate_percent: 0,
  });
  assert.deepEqual(byType.release, {
    total_transactions: 2,
    failed_transactions: 2,
    failure_rate_percent: 100,
  });
});
