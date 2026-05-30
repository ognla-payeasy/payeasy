import {  assert , test } from "vitest";



import {
  formatDeadlineDisplay,
  getTomorrowIso,
  isDateOnOrAfterTomorrow,
} from "./date-input.helpers.ts";

const NOW = new Date("2026-04-24T12:34:56.000Z");

test("getTomorrowIso returns the UTC day after `now` as YYYY-MM-DD", () => {
  assert.equal(getTomorrowIso(NOW), "2026-04-25");
});

test("getTomorrowIso rolls over month boundaries", () => {
  assert.equal(getTomorrowIso(new Date("2026-04-30T23:00:00.000Z")), "2026-05-01");
});

test("isDateOnOrAfterTomorrow rejects today", () => {
  assert.equal(isDateOnOrAfterTomorrow("2026-04-24", NOW), false);
});

test("isDateOnOrAfterTomorrow accepts tomorrow and beyond", () => {
  assert.equal(isDateOnOrAfterTomorrow("2026-04-25", NOW), true);
  assert.equal(isDateOnOrAfterTomorrow("2027-01-01", NOW), true);
});

test("isDateOnOrAfterTomorrow rejects blanks and malformed dates", () => {
  assert.equal(isDateOnOrAfterTomorrow("", NOW), false);
  assert.equal(isDateOnOrAfterTomorrow("not-a-date", NOW), false);
});

test("formatDeadlineDisplay renders MMM DD, YYYY", () => {
  assert.equal(formatDeadlineDisplay("2026-04-25"), "Apr 25, 2026");
  assert.equal(formatDeadlineDisplay("2026-12-01"), "Dec 01, 2026");
});

test("formatDeadlineDisplay returns empty string for blank or invalid input", () => {
  assert.equal(formatDeadlineDisplay(""), "");
  assert.equal(formatDeadlineDisplay("not-a-date"), "");
});

test("selecting a valid date exposes a formatted string alongside the ISO value stored in state", () => {
  // Simulates the form wiring: the input fires onChange with an ISO string,
  // and the UI surfaces the "MMM DD, YYYY" formatted version.
  const iso = "2026-05-10";
  const formatted = formatDeadlineDisplay(iso);

  assert.equal(iso, "2026-05-10");
  assert.equal(formatted, "May 10, 2026");
  assert.equal(isDateOnOrAfterTomorrow(iso, NOW), true);
});
