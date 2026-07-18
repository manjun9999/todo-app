'use client';

import { useState } from 'react';
import type { NewCustomFood } from '@/lib/types';

const EMPTY = {
  name: '',
  emoji: '',
  serving: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};

export default function AddFoodForm({
  onCreate,
}: {
  // Returns true on success so the form can reset/collapse.
  onCreate: (food: NewCustomFood) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    const num = (v: string) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    const ok = await onCreate({
      name: form.name.trim(),
      emoji: form.emoji.trim(),
      serving: form.serving.trim(),
      calories: num(form.calories),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
    });
    setSaving(false);
    if (ok) {
      setForm(EMPTY);
      setOpen(false);
    } else {
      setError('Could not save. Please try again.');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300"
      >
        ＋ Add a custom food
      </button>
    );
  }

  const field =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">New custom food</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        <input
          className={`col-span-1 ${field} text-center`}
          value={form.emoji}
          onChange={(e) => set('emoji', e.target.value)}
          placeholder="🍽️"
          aria-label="Emoji"
        />
        <input
          className={`col-span-5 ${field}`}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Name (e.g. Homemade Granola)"
          aria-label="Food name"
          required
        />
        <input
          className={`col-span-6 ${field}`}
          value={form.serving}
          onChange={(e) => set('serving', e.target.value)}
          placeholder="Serving (e.g. 1 bowl, 60 g)"
          aria-label="Serving size"
        />
        <label className="col-span-3 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Calories
          <input
            className={field}
            type="number"
            min="0"
            step="1"
            value={form.calories}
            onChange={(e) => set('calories', e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="col-span-3 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Protein (g)
          <input
            className={field}
            type="number"
            min="0"
            step="0.1"
            value={form.protein}
            onChange={(e) => set('protein', e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="col-span-3 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Carbs (g)
          <input
            className={field}
            type="number"
            min="0"
            step="0.1"
            value={form.carbs}
            onChange={(e) => set('carbs', e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="col-span-3 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Fat (g)
          <input
            className={field}
            type="number"
            min="0"
            step="0.1"
            value={form.fat}
            onChange={(e) => set('fat', e.target.value)}
            placeholder="0"
          />
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save food'}
      </button>
    </form>
  );
}
