'use client';

import { addDays, formatDayLabel, isFuture, todayStr } from '@/lib/dates';

export default function DateNav({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const today = todayStr();
  const nextDisabled = isFuture(addDays(date, 1));

  const btn =
    'flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800';

  return (
    <div className="mb-3 flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        aria-label="Previous day"
        className={btn}
      >
        ◀
      </button>

      <div className="flex items-center gap-2">
        <span className="font-semibold">{formatDayLabel(date)}</span>
        {date !== today && (
          <button
            type="button"
            onClick={() => onChange(today)}
            className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300"
          >
            Jump to today
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        disabled={nextDisabled}
        aria-label="Next day"
        className={btn}
      >
        ▶
      </button>
    </div>
  );
}
