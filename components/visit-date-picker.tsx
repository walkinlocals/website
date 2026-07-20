"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  VISIT_TIME_SLOTS,
  formatVisitTime,
  isDateFullyBooked,
  isVisitSlotInPast,
  toDateString,
} from "@/lib/match-dates";

interface Props {
  hostId: string;
  value: string | null;
  timeValue: string | null;
  onChange: (date: string) => void;
  onTimeChange: (time: string | null) => void;
  disabled?: boolean;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export default function VisitDatePicker({
  hostId,
  value,
  timeValue,
  onChange,
  onTimeChange,
  disabled,
}: Props) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/matches/availability?hostId=${encodeURIComponent(hostId)}`);
        const data = (await res.json().catch(() => ({}))) as {
          bookedSlots?: Array<{ date: string; time: string }>;
        };
        if (!cancelled && res.ok && Array.isArray(data.bookedSlots)) {
          setBookedSlots(
            new Set(data.bookedSlots.map((slot) => `${slot.date}|${slot.time}`)),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hostId]);

  const cells = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const items: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startPad; i++) {
      items.push({ date: null, key: `pad-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
      items.push({ date, key: toDateString(date) });
    }
    return items;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString("en-IE", { month: "long", year: "numeric" });
  const canGoPrev = startOfMonth(viewMonth) > startOfMonth(today);

  function isDisabledDate(date: Date): boolean {
    if (date < today) return true;
    return isDateFullyBooked(toDateString(date), bookedSlots);
  }

  function isSlotUnavailable(slot: string): boolean {
    if (!value) return true;
    if (bookedSlots.has(`${value}|${slot}`)) return true;
    return isVisitSlotInPast(value, slot);
  }

  function handleDateSelect(iso: string) {
    onChange(iso);
    if (timeValue && isSlotUnavailable(timeValue)) {
      onTimeChange(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">
          Pick a visit date
        </span>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-300" />}
      </div>

      <div className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            disabled={disabled || !canGoPrev}
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-[#002FA7] disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-serif text-sm text-slate-800">{monthLabel}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-[#002FA7] disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="visit-date-calendar-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 font-mono text-[8px] uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
          {cells.map(({ date, key }) => {
            if (!date) {
              return <div key={key} aria-hidden className="min-h-8" />;
            }
            const iso = toDateString(date);
            const unavailable = isDisabledDate(date);
            const selected = value === iso;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled || unavailable}
                onClick={() => handleDateSelect(iso)}
                className={[
                  "min-h-8 rounded-lg text-xs font-light transition",
                  unavailable && "cursor-not-allowed text-slate-200",
                  !unavailable && !selected && "text-slate-700 hover:bg-[#002fa7]/5 hover:text-[#002FA7]",
                  selected && "bg-[#002FA7] font-medium text-white shadow-sm",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {value && (
        <div className="space-y-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">
            Pick a time · 10am – 5pm
          </span>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {VISIT_TIME_SLOTS.map((slot) => {
              const unavailable = isSlotUnavailable(slot);
              const selected = timeValue === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={disabled || unavailable}
                  onClick={() => onTimeChange(slot)}
                  className={[
                    "rounded-lg px-1 py-2 text-[10px] font-mono transition",
                    unavailable && "cursor-not-allowed text-slate-200",
                    !unavailable && !selected && "text-slate-600 hover:bg-[#002fa7]/5 hover:text-[#002FA7]",
                    selected && "bg-[#002FA7] font-semibold text-white shadow-sm",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {formatVisitTime(slot)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] font-light leading-relaxed text-slate-400">
        Greyed-out dates and times are unavailable. Visits are offered in 30-minute slots between 10am and 5pm.
      </p>
    </div>
  );
}
