import type { Food } from './types';

// A small catalog of common foods with approximate nutrition per serving.
// Values are rounded from standard USDA reference data — good enough for
// quick everyday tracking, not clinical precision.
export const FOODS: Food[] = [
  { id: 'chicken-breast', name: 'Chicken Breast', emoji: '🍗', category: 'Protein', serving: '100 g, grilled', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'salmon', name: 'Salmon', emoji: '🐟', category: 'Protein', serving: '100 g, baked', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'ground-beef', name: 'Ground Beef (85%)', emoji: '🥩', category: 'Protein', serving: '100 g, cooked', calories: 250, protein: 26, carbs: 0, fat: 15 },
  { id: 'turkey-breast', name: 'Turkey Breast', emoji: '🦃', category: 'Protein', serving: '100 g, roasted', calories: 135, protein: 30, carbs: 0, fat: 1 },
  { id: 'tuna', name: 'Canned Tuna', emoji: '🐟', category: 'Protein', serving: '1 can (142 g), drained', calories: 130, protein: 29, carbs: 0, fat: 1 },
  { id: 'eggs', name: 'Egg', emoji: '🥚', category: 'Protein', serving: '1 large', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { id: 'black-beans', name: 'Black Beans', emoji: '🫘', category: 'Protein', serving: '1 cup, cooked', calories: 227, protein: 15, carbs: 41, fat: 0.9 },
  { id: 'protein-shake', name: 'Whey Protein Shake', emoji: '🥤', category: 'Protein', serving: '1 scoop in water', calories: 120, protein: 24, carbs: 3, fat: 1.5 },

  { id: 'white-rice', name: 'White Rice', emoji: '🍚', category: 'Grains', serving: '1 cup, cooked', calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  { id: 'oatmeal', name: 'Oatmeal', emoji: '🥣', category: 'Grains', serving: '1 cup, cooked', calories: 158, protein: 6, carbs: 27, fat: 3.2 },
  { id: 'whole-wheat-bread', name: 'Whole Wheat Bread', emoji: '🍞', category: 'Grains', serving: '1 slice', calories: 69, protein: 3.6, carbs: 12, fat: 0.9 },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', category: 'Grains', serving: '1 cup, cooked', calories: 220, protein: 8, carbs: 43, fat: 1.3 },
  { id: 'quinoa', name: 'Quinoa', emoji: '🌾', category: 'Grains', serving: '1 cup, cooked', calories: 222, protein: 8, carbs: 39, fat: 3.6 },
  { id: 'sweet-potato', name: 'Sweet Potato', emoji: '🍠', category: 'Grains', serving: '1 medium, baked', calories: 103, protein: 2.3, carbs: 24, fat: 0.2 },

  { id: 'banana', name: 'Banana', emoji: '🍌', category: 'Fruit', serving: '1 medium', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: 'apple', name: 'Apple', emoji: '🍎', category: 'Fruit', serving: '1 medium', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: 'orange', name: 'Orange', emoji: '🍊', category: 'Fruit', serving: '1 medium', calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'Fruit', serving: '1/2 medium', calories: 114, protein: 1.3, carbs: 6, fat: 10.5 },

  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'Vegetables', serving: '1 cup, steamed', calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'Vegetables', serving: '1 cup, raw', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1 },

  { id: 'greek-yogurt', name: 'Greek Yogurt', emoji: '🥛', category: 'Dairy', serving: '1 cup, plain', calories: 130, protein: 22, carbs: 8, fat: 0.8 },
  { id: 'milk', name: 'Milk (2%)', emoji: '🥛', category: 'Dairy', serving: '1 cup', calories: 122, protein: 8, carbs: 12, fat: 4.8 },
  { id: 'cheddar', name: 'Cheddar Cheese', emoji: '🧀', category: 'Dairy', serving: '1 oz', calories: 115, protein: 7, carbs: 0.4, fat: 9.5 },

  { id: 'almonds', name: 'Almonds', emoji: '🌰', category: 'Snacks', serving: '1 oz (~23 nuts)', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: 'peanut-butter', name: 'Peanut Butter', emoji: '🥜', category: 'Snacks', serving: '2 tbsp', calories: 188, protein: 8, carbs: 6, fat: 16 },
];
