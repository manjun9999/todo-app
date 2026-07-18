'use client';

import { useState } from 'react';
import type { CatalogFood } from '@/lib/types';
import QuantityStepper from './QuantityStepper';

export default function FoodCard({
  food,
  onAdd,
  onDelete,
  disabled,
}: {
  food: CatalogFood;
  onAdd: (food: CatalogFood, quantity: number) => void;
  onDelete?: (food: CatalogFood) => void;
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const scaledCalories = Math.round(food.calories * qty);

  function handleAdd() {
    onAdd(food, qty);
    setQty(1); // reset for the next add
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-2xl" aria-hidden>
          {food.emoji}
        </span>
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {scaledCalories} kcal
        </span>
      </div>
      <div>
        <p className="font-medium leading-tight text-slate-900 dark:text-slate-100">
          {food.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{food.serving}</p>
      </div>
      {food.custom && (
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Custom
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(food)}
              aria-label={`Delete custom food ${food.name}`}
              className="text-xs text-slate-400 transition hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <QuantityStepper
          value={qty}
          onChange={setQty}
          ariaLabel={`Servings of ${food.name}`}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          aria-label={`Add ${formatServings(qty)} ${food.name} to log`}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function formatServings(qty: number): string {
  return qty === 1 ? '1 serving' : `${qty} servings`;
}
