import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Ask Gemini to estimate the nutrition for a plain-text meal description.
 * Returns { calories, protein, carbs, fat } (grams for macros).
 */
export async function estimateCalories(description) {
  const model = genAI.getGenerativeModel({
    model: config.geminiModel,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `Estimate the nutrition for this meal and respond ONLY with JSON
matching {"calories": number, "protein": number, "carbs": number, "fat": number}
(macros in grams). Meal: "${description}"`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text);
}
