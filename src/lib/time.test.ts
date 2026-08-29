import test from "node:test";
import assert from "node:assert/strict";
import {
  STANDARD_DURATION_MIN,
  SATURDAY_DURATION_MIN,
  baseDurationForDay,
  shortLeaveDeductionForDay,
  formatDuration,
  parseFlexibleTime,
  formatClock,
  crossesMidnight,
} from "./time";

test("baseDurationForDay returns 8h 15m (495 mins) for Saturday", () => {
  assert.equal(SATURDAY_DURATION_MIN, 495);
  assert.equal(baseDurationForDay("Saturday"), 495);
  assert.equal(formatDuration(baseDurationForDay("Saturday")), "8h 15m");
});

test("baseDurationForDay returns 9h 00m (540 mins) for regular weekdays", () => {
  assert.equal(STANDARD_DURATION_MIN, 540);
  assert.equal(baseDurationForDay("Monday"), 540);
  assert.equal(formatDuration(baseDurationForDay("Monday")), "9h 00m");
});

test("shortLeaveDeductionForDay returns correct values", () => {
  assert.equal(shortLeaveDeductionForDay("Saturday"), 30);
  assert.equal(shortLeaveDeductionForDay("Monday"), 45);
});

test("parseFlexibleTime parses various time inputs correctly", () => {
  assert.equal(parseFlexibleTime("9"), 540);
  assert.equal(parseFlexibleTime("09:30"), 570);
  assert.equal(parseFlexibleTime("9:15 AM"), 555);
  assert.equal(parseFlexibleTime("5:15 PM"), 1035);
  assert.equal(parseFlexibleTime("invalid"), null);
});

test("formatClock converts minutes to 12-hour clock format", () => {
  assert.equal(formatClock(555), "9:15 AM");
  assert.equal(formatClock(570), "9:30 AM");
  assert.equal(formatClock(555 + 495), "5:30 PM"); // 9:15 AM + 8h 15m (Saturday) = 5:30 PM
  assert.equal(formatClock(555 + 540), "6:15 PM"); // 9:15 AM + 9h 00m (Weekday) = 6:15 PM
});

test("crossesMidnight detects day rollover", () => {
  assert.equal(crossesMidnight(1200, 495), true); // 8:00 PM + 8h 15m = 4:15 AM next day
  assert.equal(crossesMidnight(570, 495), false); // 9:30 AM + 8h 15m = 5:45 PM same day
});
