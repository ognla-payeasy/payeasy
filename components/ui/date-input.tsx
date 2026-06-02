"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { FieldError, fieldBorderClass } from "@/components/ui/field-error";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { detectIOS } from "@/lib/platform/is-ios";
import {
  formatDeadlineDisplay,
  getTomorrowIso,
} from "./date-input.helpers";

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Optional override for the minimum selectable date (ISO "YYYY-MM-DD"). Defaults to tomorrow. */
  min?: string;
  error?: string;
  "aria-describedby"?: string;
}

const DISPLAY_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function parseIso(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildSelectableDates(minIso: string, yearsAhead = 5): string[] {
  const min = parseIso(minIso);
  if (!min) return [];

  const dates: string[] = [];
  const endYear = min.year + yearsAhead;

  for (let year = min.year; year <= endYear; year++) {
    const startMonth = year === min.year ? min.month : 1;
    const endMonth = 12;
    for (let month = startMonth; month <= endMonth; month++) {
      const startDay = year === min.year && month === min.month ? min.day : 1;
      const lastDay = daysInMonth(year, month);
      for (let day = startDay; day <= lastDay; day++) {
        dates.push(toIso(year, month, day));
      }
    }
  }
  return dates;
}

function IosDatePickerSheet({
  id,
  value,
  minIso,
  onChange,
  isOpen,
  onClose,
}: {
  id: string;
  value: string;
  minIso: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const selectableDates = useMemo(() => buildSelectableDates(minIso), [minIso]);
  const minParsed = parseIso(minIso);
  const initial = parseIso(value) ?? minParsed;

  const [year, setYear] = useState(initial?.year ?? minParsed?.year ?? new Date().getUTCFullYear());
  const [month, setMonth] = useState(initial?.month ?? minParsed?.month ?? 1);
  const [day, setDay] = useState(initial?.day ?? minParsed?.day ?? 1);

  useEffect(() => {
    if (!isOpen) return;
    const parsed = parseIso(value) ?? minParsed;
    if (parsed) {
      setYear(parsed.year);
      setMonth(parsed.month);
      setDay(parsed.day);
    }
  }, [isOpen, value, minParsed]);

  const years = useMemo(() => {
    if (!minParsed) return [];
    const end = minParsed.year + 5;
    return Array.from({ length: end - minParsed.year + 1 }, (_, i) => minParsed.year + i);
  }, [minParsed]);

  const months = useMemo(() => {
    if (!minParsed) return [];
    const start = year === minParsed.year ? minParsed.month : 1;
    return Array.from({ length: 12 - start + 1 }, (_, i) => start + i);
  }, [minParsed, year]);

  const days = useMemo(() => {
    if (!minParsed) return [];
    const last = daysInMonth(year, month);
    const start =
      year === minParsed.year && month === minParsed.month ? minParsed.day : 1;
    return Array.from({ length: last - start + 1 }, (_, i) => start + i);
  }, [minParsed, year, month]);

  useEffect(() => {
    if (!months.includes(month)) setMonth(months[0] ?? month);
  }, [months, month]);

  useEffect(() => {
    if (!days.includes(day)) setDay(days[0] ?? day);
  }, [days, day]);

  const selectedIso = toIso(year, month, day);
  const isValid = selectableDates.includes(selectedIso);

  function handleConfirm() {
    if (isValid) {
      onChange(selectedIso);
      onClose();
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Select deadline">
      <div className="space-y-5 px-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-ios-month`} className="text-[10px] font-black uppercase tracking-widest text-dark-500">
              Month
            </label>
            <select
              id={`${id}-ios-month`}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-sm text-white focus:border-brand-400 focus:outline-none"
            >
              {months.map((m) => (
                <option key={m} value={m} className="bg-[#111118]">
                  {DISPLAY_MONTHS[m - 1]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-ios-day`} className="text-[10px] font-black uppercase tracking-widest text-dark-500">
              Day
            </label>
            <select
              id={`${id}-ios-day`}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-sm text-white focus:border-brand-400 focus:outline-none"
            >
              {days.map((d) => (
                <option key={d} value={d} className="bg-[#111118]">
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-ios-year`} className="text-[10px] font-black uppercase tracking-widest text-dark-500">
              Year
            </label>
            <select
              id={`${id}-ios-year`}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-sm text-white focus:border-brand-400 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-[#111118]">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-center text-sm text-brand-200 font-medium">
          {formatDeadlineDisplay(selectedIso) || "Select a date"}
        </p>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid}
          className="btn-primary w-full !py-3 !rounded-xl font-black uppercase tracking-widest disabled:opacity-50"
        >
          Confirm date
        </button>
      </div>
    </BottomSheet>
  );
}

export function DateInput({
  id,
  value,
  onChange,
  min,
  error,
  "aria-describedby": ariaDescribedBy,
}: DateInputProps) {
  const minIso = useMemo(() => min ?? getTomorrowIso(), [min]);
  const formatted = formatDeadlineDisplay(value);
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  const [isIOS, setIsIOS] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setIsIOS(detectIOS());
  }, []);

  return (
    <div className="space-y-2">
      <div
        className={`relative flex items-center rounded-xl border bg-white/5 transition-colors focus-within:border-brand-400 ${fieldBorderClass(error, !!value)}`}
      >
        <span
          className="pointer-events-none flex items-center justify-center pl-3 text-dark-500"
          aria-hidden="true"
        >
          <CalendarDays size={18} />
        </span>

        {isIOS ? (
          <>
            <button
              type="button"
              id={id}
              onClick={() => setSheetOpen(true)}
              aria-describedby={describedBy}
              aria-invalid={!!error}
              data-testid="deadline-date-input"
              className="flex w-full items-center justify-between bg-transparent px-3 py-3 text-left text-dark-100 focus:outline-none"
            >
              <span className={formatted ? "text-dark-100" : "text-dark-600"}>
                {formatted || "Select deadline date"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-dark-500" aria-hidden="true" />
            </button>
            <IosDatePickerSheet
              id={id}
              value={value}
              minIso={minIso}
              onChange={onChange}
              isOpen={sheetOpen}
              onClose={() => setSheetOpen(false)}
            />
          </>
        ) : (
          <input
            id={id}
            type="date"
            value={value}
            min={minIso}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            data-testid="deadline-date-input"
            className="w-full bg-transparent px-3 py-3 text-dark-100 placeholder:text-dark-600 focus:outline-none [color-scheme:dark]"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span
          data-testid="deadline-formatted"
          className={formatted ? "text-brand-200" : "text-dark-500"}
        >
          {formatted || "No date selected"}
        </span>
        <span className="text-xs text-dark-500">
          Earliest: {formatDeadlineDisplay(minIso)}
        </span>
      </div>

      <FieldError id={errorId ?? `${id}-error`} message={error} />
    </div>
  );
}
