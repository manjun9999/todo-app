# CloudCaloryTracker

An AI-powered calorie tracker. Describe a meal in plain text and the Gemini API
estimates its calories and macros.

## Setup

```bash
npm install
cp .env.example .env   # then add your Gemini API key
npm run dev
```

The server starts on http://localhost:3000.

## Environment

| Variable         | Description                          | Default            |
| ---------------- | ------------------------------------ | ------------------ |
| `GEMINI_API_KEY` | Your Google Gemini API key           | —                  |
| `GEMINI_MODEL`   | Model to use for estimates           | `gemini-1.5-flash` |
| `PORT`           | Port the server listens on           | `3000`             |

## API

| Method | Route            | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| GET    | `/health`        | Health check                                   |
| GET    | `/api/meals`     | List logged meals                              |
| POST   | `/api/meals`     | Log a meal `{ "description": "..." }`          |

### Example

```bash
curl -X POST http://localhost:3000/api/meals \
  -H "Content-Type: application/json" \
  -d '{"description": "two scrambled eggs and a slice of toast"}'
```

## Project structure

```
src/
  server.js          Express app + startup
  config.js          Environment config
  routes/meals.js    Meal logging endpoints
  services/gemini.js Gemini nutrition estimation
```

## Notes

Meals are stored in memory and reset on restart — swap the array in
`src/routes/meals.js` for a real database when you're ready.
