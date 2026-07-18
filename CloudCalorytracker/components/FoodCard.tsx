'use client';

import type { Food } from '@/lib/types';

export default function FoodCard({
  food,
  onAdd,
  disabled,
}: {
  food: Food;
  onAdd: (food: Food) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(food)}
      disabled={disabled}
      className="group flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
      aria-label={`Add ${food.name} to log`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-2xl" aria-hidden>
          {food.emoji}
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:bg-emerald-900/50 dark:text-emerald-300">
          + Add
        </span>
      </div>
      <span className="mt-1 font-medium leading-tight text-slate-900 dark:text-slate-100">
        {food.name}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{food.serving}</span>
      <span className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        {food.calories} kcal
      </span>
    </button>
  );
}
