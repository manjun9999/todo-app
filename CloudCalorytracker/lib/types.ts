// Shared domain types for the calorie tracker.

/** A food from the static catalog, with nutrition per one serving. */
export interface Food {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  serving: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export type FoodCategory =
  | 'Protein'
  | 'Grains'
  | 'Fruit'
  | 'Vegetables'
  | 'Dairy'
  | 'Snacks'
  | 'Custom';

/**
 * A food shown in the catalog — either a built-in Food or a user-defined one.
 * Custom foods carry `custom: true` and their database id in `dbId`.
 */
export interface CatalogFood extends Food {
  custom?: boolean;
  dbId?: number;
}

/** Fields a user provides when creating a custom food. */
export interface NewCustomFood {
  name: string;
  emoji: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A single "I ate this" record, persisted in the database. */
export interface LogEntry {
  id: number;
  foodName: string;
  serving: string;
  quantity: number; // number of servings, e.g. 2 or 1.5
  calories: number; // eaten amount = per-serving × quantity
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // ISO timestamp
}

/** Aggregate nutrition totals for a set of log entries. */
export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Response shape for GET /api/log. */
export interface LogResponse {
  entries: LogEntry[];
  totals: Totals;
  goal: number; // daily calorie goal
}
