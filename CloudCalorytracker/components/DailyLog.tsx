'use client';

import type { LogEntry } from '@/lib/types';
import QuantityStepper, { formatQty } from './QuantityStepper';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function DailyLog({
  entries,
  onRemove,
  onQuantityChange,
}: {
  entries: LogEntry[];
  onRemove: (id: number) => void;
  onQuantityChange: (id: number, quantity: number) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Nothing logged yet. Tap a food above to add it. 🍽️
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
              {entry.foodName}
              {entry.quantity !== 1 && (
                <span className="ml-1.5 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                  ×{formatQty(entry.quantity)}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {entry.serving ? `${entry.serving} · ` : ''}
              {formatTime(entry.loggedAt)} · P {entry.protein} / C {entry.carbs} / F {entry.fat}
            </p>
            <div className="mt-2">
              <QuantityStepper
                value={entry.quantity}
                onChange={(q) => onQuantityChange(entry.id, q)}
                ariaLabel={`Servings of ${entry.foodName}`}
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 pl-2">
            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {entry.calories} kcal
            </span>
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              aria-label={`Remove ${entry.foodName}`}
              className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
