import { Router } from 'express';
import { estimateCalories } from '../services/gemini.js';

const router = Router();

// In-memory store for now — swap for a real DB later.
const meals = [];

// List all logged meals
router.get('/', (req, res) => {
  res.json(meals);
});

// Log a meal from a text description; Gemini estimates the nutrition.
router.post('/', async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    const nutrition = await estimateCalories(description);
    const meal = {
      id: meals.length + 1,
      description,
      ...nutrition,
      loggedAt: new Date().toISOString(),
    };
    meals.push(meal);
    res.status(201).json(meal);
  } catch (err) {
    next(err);
  }
});

export default router;
