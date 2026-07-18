import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
};

if (!config.geminiApiKey || config.geminiApiKey === 'your-key-here') {
  console.warn(
    '[config] GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.'
  );
}
