"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DAYS,
  baseDurationForDay,
  crossesMidnight,
  formatClock,
  formatDuration,
  parseFlexibleTime,
  shortLeaveDeductionForDay,
} from "../lib/time";
import type { DayName } from "../lib/time";

const DEFAULT_START = "09:30";

export default function ShortLeaveCalculator() {
  // Snapshot of "now", refreshed every 30s. Used to default the day picker,
  // show today's date, and — the fun part — notice if you're still here
  // *after* your own exit time.
  const [now, setNow] = useState<Date | null>(null);
  const [day, setDay] = useState<DayName>("Monday");
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [shortLeave, setShortLeave] = useState(false);
  const [shortLeaveMinutes, setShortLeaveMinutes] = useState(
    shortLeaveDeductionForDay("Monday")
  );
  const [minutesTouched, setMinutesTouched] = useState(false);

  // Default to the real current day on mount, so first paint still matches
  // between server and client, then keep `now` ticking for the overdue check.
  useEffect(() => {
    const today = new Date();
    setNow(today);
    setDay(DAYS[today.getDay()]);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Whenever the day changes (and the user hasn't hand-edited the minutes),
  // snap the short-leave minutes to that day's usual rate (45, 30 on Saturday).
  useEffect(() => {
    if (!minutesTouched) {
      setShortLeaveMinutes(shortLeaveDeductionForDay(day));
    }
  }, [day, minutesTouched]);

  const startMinutes = useMemo(() => parseFlexibleTime(startTime), [startTime]);
  const baseDuration = baseDurationForDay(day);
  const isSaturday = day === "Saturday";
  const defaultDeduction = shortLeaveDeductionForDay(day);
  const safeShortLeaveMinutes = Number.isFinite(shortLeaveMinutes)
    ? Math.max(0, Math.min(shortLeaveMinutes, baseDuration))
    : 0;
  const effectiveDuration = shortLeave
    ? baseDuration - safeShortLeaveMinutes
    : baseDuration;

  const exitMinutes =
    startMinutes === null ? null : startMinutes + effectiveDuration;
  const rollsOver =
    startMinutes !== null && crossesMidnight(startMinutes, effectiveDuration);

  // Only makes sense to compare against the clock when we're actually
  // talking about today.
  const isToday = !!now && DAYS[now.getDay()] === day;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : null;
  const minutesOverdue =
    isToday && nowMinutes !== null && exitMinutes !== null && !rollsOver
      ? nowMinutes - exitMinutes
      : null;
  const isOverdue = minutesOverdue !== null && minutesOverdue > 0;

  const OVERDUE_MESSAGES = [
    "Buddy, freedom o'clock came and went. It didn't even wait for you.",
    "Still here? Bold. Deeply, deeply bold.",
    "Your exit time called. It's filing a missing person report.",
    "The door is right there. It has been right there for a while.",
    "Congrats, you're now doing unpaid overtime for a calculator.",
    "Somewhere, your chair is judging you for still being in it.",
  ];
  const overdueMessage =
    minutesOverdue !== null
      ? OVERDUE_MESSAGES[minutesOverdue % OVERDUE_MESSAGES.length]
      : "";

  return (
    <div className="flex min-h-full w-full max-w-md flex-col justify-center overflow-x-hidden py-2">
      {/* Eyebrow */}
      <div className="mb-2 flex items-center justify-center gap-3 text-[#8A93A6]">
        <span className="h-px w-8 bg-[#39415A]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.3em]">
          Dept. of Sneaking Out (Legally)
        </p>
        <span className="h-px w-8 bg-[#39415A]" />
      </div>

      {/* Ticket */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-[#1B2030] to-[#161A28] p-1.5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]">
        <div className="rounded-[14px] border border-[#2B3247] bg-[#F3EEE2] text-[#23262F]">
          {/* Stub 1: inputs */}
          <div className="px-5 pb-3 pt-3.5 sm:px-6">
            <div className="mb-2.5 flex items-baseline justify-between">
              <h1 className="font-mono text-sm font-bold uppercase tracking-[0.08em] text-[#23262F]">
                Short Leave Calculator
              </h1>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#A5701E]">
                Ticket #045
              </span>
            </div>

            {/* Day + Start time side by side to save vertical space */}
            <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Day{" "}
                  {now && DAYS[now.getDay()] === day && (
                    <span className="normal-case text-[#2F9E8F]">(today)</span>
                  )}
                </span>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as DayName)}
                  className="w-full rounded-lg border border-[#D8CFB8] bg-white px-2 py-2 font-mono text-xs text-[#23262F] shadow-inner outline-none focus:border-[#D79A3D] focus:ring-2 focus:ring-[#D79A3D]/30"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {now && DAYS[now.getDay()] === d ? " · today" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Showed up at
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStartTime(new Date().toTimeString().slice(0, 5))
                    }
                    className="text-[10px] font-semibold text-[#2F9E8F] underline-offset-2 hover:underline"
                  >
                    now
                  </button>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="9:15 AM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full rounded-lg border bg-white px-2 py-2 font-mono text-xs tabular-nums text-[#23262F] shadow-inner outline-none focus:ring-2 ${
                    startTime && startMinutes === null
                      ? "border-[#C1443C] focus:border-[#C1443C] focus:ring-[#C1443C]/30"
                      : "border-[#D8CFB8] focus:border-[#D79A3D] focus:ring-[#D79A3D]/30"
                  }`}
                />
              </label>
            </div>

            {/* Base duration readout */}
            <div className="mb-2 flex items-center justify-between rounded-lg bg-[#E9E1CC] px-2.5 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                The grind{isSaturday ? " (Saturday, ugh)" : ""}
              </span>
              <span className="font-mono text-xs font-bold text-[#23262F]">
                {formatDuration(baseDuration)}
              </span>
            </div>

            {/* Short leave toggle */}
            <button
              type="button"
              onClick={() => setShortLeave((v) => !v)}
              aria-pressed={shortLeave}
              className={`group flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all active:scale-[0.99] ${
                shortLeave
                  ? "border-[#2F9E8F] bg-[#2F9E8F]/10"
                  : "border-[#D8CFB8] bg-white/60 hover:border-[#B9812A]/60"
              }`}
            >
              <span>
                <span className="block text-xs font-semibold text-[#23262F]">
                  {shortLeave ? "Sneaking out early 😎" : "Leaving early today? 👀"}
                </span>
                <span className="block text-[10px] text-[#6B7280]">
                  {shortLeave
                    ? `Docking ${safeShortLeaveMinutes} totally-earned minutes.`
                    : `Set the minutes below and flip me on.`}
                </span>
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  shortLeave ? "bg-[#2F9E8F]" : "bg-[#C9C1AA] group-hover:bg-[#B9812A]/60"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    shortLeave ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>

            {/* Editable short-leave minutes */}
            <div
              className={`mt-1.5 flex items-center justify-between rounded-lg border px-2.5 py-1.5 transition-opacity ${
                shortLeave
                  ? "border-[#D8CFB8] bg-white opacity-100"
                  : "border-[#D8CFB8]/60 bg-white/40 opacity-60"
              }`}
            >
              <label htmlFor="short-leave-minutes" className="text-[10px] text-[#6B7280]">
                Minutes to dock
                <span className="ml-1 text-[9px] text-[#A5701E]">
                  (default {defaultDeduction}{isSaturday ? ", Sat rate" : ""})
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="short-leave-minutes"
                  type="number"
                  min={0}
                  max={baseDuration}
                  step={5}
                  disabled={!shortLeave}
                  value={shortLeaveMinutes}
                  onChange={(e) => {
                    setMinutesTouched(true);
                    setShortLeaveMinutes(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    );
                  }}
                  className="w-16 rounded-md border border-[#D8CFB8] bg-white px-1.5 py-1 text-right font-mono text-xs tabular-nums text-[#23262F] outline-none focus:border-[#D79A3D] focus:ring-2 focus:ring-[#D79A3D]/30 disabled:bg-[#F3EEE2] disabled:text-[#A9A192]"
                />
                <span className="text-[10px] text-[#6B7280]">min</span>
                {minutesTouched && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinutesTouched(false);
                      setShortLeaveMinutes(defaultDeduction);
                    }}
                    className="text-[10px] font-semibold text-[#2F9E8F] underline-offset-2 hover:underline"
                  >
                    reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Perforation divider */}
          <div className="relative h-3">
            <div
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t-2 border-dashed border-[#C9C1AA]"
            />
            <div className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#161A28]" />
            <div className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#161A28]" />
          </div>

          {/* Stub 2: result */}
          <div className="relative overflow-hidden px-5 py-3 sm:px-6">
            {/* duration stamp */}
            <div className="pointer-events-none absolute -right-3 top-2.5 rotate-[8deg] rounded-md border-2 border-[#C1443C]/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#C1443C]/70">
              {formatDuration(effectiveDuration)} · survived
            </div>

            <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Freedom o&rsquo;clock
            </span>

            {exitMinutes === null ? (
              <p className="font-mono text-xs text-[#C1443C]">
                Enter a valid time above — even escape artists need a start time.
              </p>
            ) : (
              <>
                <p className="font-mono text-3xl font-bold tabular-nums leading-none text-[#23262F] sm:text-4xl">
                  {formatClock(exitMinutes)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#2F9E8F]">
                  {shortLeave
                    ? "Set an alarm. Sprint to the door. Look casual."
                    : "Mark it. Watch it. Live for it."}
                </p>
                {rollsOver && (
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C1443C]">
                    That&rsquo;s basically tomorrow. Bold shift.
                  </p>
                )}
                {isOverdue && (
                  <div className="mt-1.5 rounded-lg border border-dashed border-[#C1443C]/60 bg-[#C1443C]/10 px-2.5 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#C1443C]">
                      {minutesOverdue} minutes overdue for freedom
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#8A5048]">{overdueMessage}</p>
                  </div>
                )}
              </>
            )}

            <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[#D8CFB8] pt-2 text-[10px] text-[#6B7280]">
              <span>
                {day} · in at{" "}
                <span className="font-mono text-[#23262F]">
                  {startMinutes === null ? "—" : formatClock(startMinutes)}
                </span>
              </span>
              <span className="font-mono text-[#23262F]">
                {formatDuration(effectiveDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
