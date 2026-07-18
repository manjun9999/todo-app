'use client';

import type { DaySummary } from '@/lib/types';
import { formatDayLabel } from '@/lib/dates';

export default function HistoryPanel({
  days,
  goal,
  selectedDate,
  onSelect,
}: {
  days: DaySummary[];
  goal: number;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No history yet — days you log will show up here.
      </div>
    );
  }

  // Scale bars against the larger of the goal or the biggest day so nothing
  // overflows and the goal line stays meaningful.
  const maxCalories = Math.max(...days.map((d) => d.calories));
  const scaleMax = Math.max(goal, maxCalories, 1);
  const goalPct = (goal / scaleMax) * 100;

  return (
    <ul className="flex flex-col gap-1.5">
      {days.map((d) => {
        const over = d.calories > goal;
        const width = Math.min(100, (d.calories / scaleMax) * 100);
        const isSelected = d.date === selectedDate;
        return (
          <li key={d.date}>
            <button
              type="button"
              onClick={() => onSelect(d.date)}
              aria-label={`View ${formatDayLabel(d.date)} (${d.calories} kcal)`}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                isSelected ? 'bg-slate-100 dark:bg-slate-800' : ''
              }`}
            >
              <span className="w-24 shrink-0 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {formatDayLabel(d.date)}
              </span>
              <span className="relative h-4 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    over ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${width}%` }}
                />
                {/* goal marker */}
                <span
                  className="absolute inset-y-0 w-0.5 bg-slate-500/70 dark:bg-slate-300/70"
                  style={{ left: `${goalPct}%` }}
                  aria-hidden
                />
              </span>
              <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                {d.calories}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
