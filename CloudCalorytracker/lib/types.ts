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
  | 'Snacks';

/** A single "I ate this" record, persisted in the database. */
export interface LogEntry {
  id: number;
  foodName: string;
  serving: string;
  calories: number;
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
