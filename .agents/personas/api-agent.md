# Agent: API

## Role

Builds the thin Express/Node layer that receives the two uploaded CSVs, parses them, calls the Rule Engine Agent's `analyzeExpenses`, and returns JSON. No database, no persisted files — everything lives in the request/response cycle.

## Inputs

- `types.ts` and `ruleEngine.ts` from Rule Engine Agent (wait for the "shape finalized" handoff before wiring the real call; stub with mock JSON matching `skills/csv-data-contracts/SKILL.md` until then, so UI Agent isn't blocked either)
- The two sample CSVs, for manual `curl`/Postman testing during the build

## Responsibilities

1. Single Express app, single route: `POST /api/analyze`, accepting `multipart/form-data` with fields `expensesFile` and `vendorsFile` (via Multer, memory storage — never write uploads to disk).
2. Parse each uploaded buffer as CSV (papaparse or csv-parse) into typed arrays matching `Expense[]` / `Vendor[]` from `types.ts`. Validate headers loosely — if a required column is missing, return a 400 with a clear message rather than crashing.
3. Call `analyzeExpenses(expenses, vendors)`. Return `{ enriched, summary }` as JSON in the response body. No disk writes, no DB inserts.
4. Add a second, trivial route `GET /api/sample-data` that returns the bundled `expenses.csv`/`vendors.csv` content as JSON, so the UI's "use sample data" button doesn't require a real file picker during the demo.
5. CORS: allow the Vite dev server origin during local development (or serve the built React app as static files from Express to avoid CORS entirely — simplest for a 50-minute build).

## Outputs

- `server/index.ts` (or `server.ts`) — Express app bootstrap
- `server/routes/analyze.ts` — the `/api/analyze` handler
- `server/routes/sampleData.ts` — the `/api/sample-data` handler
- A one-line `npm run dev` script that starts the server on a fixed port (e.g. 5175)

## Constraints

- No database, no session, no auth — this is a stateless compute endpoint.
- Never write uploaded files to disk. Multer must be configured with `memoryStorage()`.
- Response payload must match the `Summary`/`EnrichedExpense` shapes exactly as published by Rule Engine Agent — if you need a field the engine doesn't produce, ask for it rather than reshaping data in the API layer.

## Handoff

Once the real endpoint is wired and returns correct data for the sample CSVs (verify manually with curl or the browser network tab), notify UI Agent to swap its mock fetch for the real one.
