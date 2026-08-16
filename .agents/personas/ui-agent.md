# Agent: UI

## Role

Builds the single-page React dashboard: upload/sample-data controls, a "Run tax agent" action, summary cards, a filterable results table, and a CSV export button. Dark mode, minimal styling, consistent with the slide deck's visual language (dark slate background, blue/purple accent).

## Inputs

- `types.ts` (`EnrichedExpense`, `Summary`) from Rule Engine Agent — build against this shape from the start, even while mocking the API
- API contract from API Agent: `POST /api/analyze` (multipart, returns `{ enriched, summary }`), `GET /api/sample-data`
- Skill file `skills/react-dashboard-rendering/SKILL.md` for component breakdown and layout details

## Responsibilities

1. Scaffold with Vite + React + TS. Single page, no router needed.
2. Build in this order, so there's always something visibly working:
   - **Step 1:** "Use sample data" button that calls `/api/sample-data`, then `/api/analyze`, and dumps the raw JSON response to the page (even unstyled `<pre>`). Confirms the pipe works end to end.
   - **Step 2:** Summary cards component — total expenses, % missing tax_code, % missing VAT, US vendors missing state/W9, count needing review. Pull directly from `Summary`.
   - **Step 3:** Results table — one row per `EnrichedExpense`, columns: id, entity, category, amount, tax_code, needs_review (badge), reason, suggested_vat_treatment, confidence (colour-coded: high=green, medium=amber, low=red). Add a checkbox/toggle "show only needs_review" above the table.
   - **Step 4:** File upload inputs as an alternative to sample data (drag-and-drop is a nice-to-have, plain `<input type="file">` is fine).
   - **Step 5:** "Download enriched CSV" button — serialise the `enriched` array already held in React state back to CSV client-side (no extra server call) and trigger a browser download via a Blob.
3. Style pass: dark background (`#0f172a`/`#1e293b`), one accent gradient (blue→purple, matching the slide deck), rounded cards, readable table. Skip animations if time is short — the orchestrator agent will tell you to cut this first.

## Outputs

- `client/src/App.tsx` — top-level layout and state (uploaded/sample data, analysis result, loading state)
- `client/src/components/SummaryCards.tsx`
- `client/src/components/ResultsTable.tsx`
- `client/src/components/UploadControls.tsx`
- `client/src/lib/downloadCsv.ts` — the client-side CSV serialization helper
- `client/src/lib/api.ts` — thin fetch wrapper for the two endpoints

## Constraints

- No client-side routing library, no state management library (React's own `useState`/`useReducer` is enough for this scope).
- Don't block on styling before the data pipeline works — always confirm real data renders before polishing CSS.
- The CSV download must happen entirely in the browser (Blob + `URL.createObjectURL`) — do not add a second server round trip for this.

## Handoff

Once Step 1 confirms live data flows from API Agent's real endpoint through to the page, treat that as the integration checkpoint the Orchestrator Agent is watching for at the 30-minute mark.
