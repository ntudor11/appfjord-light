# PLAN.md — Tax/VAT/1099 Data Quality & Expense VAT Agent

## 1. What we're building

A small web app, no database, that ingests two CSVs (`expenses.csv`, `vendors.csv`), runs a rule-based tax/VAT/1099 data-quality check, and returns:

- an enriched CSV (`expenses_enriched.csv`) with a `needs_review`, `reason`, `suggested_vat_treatment`, and `confidence` column per row
- a summary report (JSON, rendered as a dashboard) with headline stats a Controller/Head of Tax can act on immediately

This directly answers three quotes from the finance team:

- "There is no decision tree for expense VAT... this is a meal in Sweden and needs this treatment... we do all of that manually." (Group financial controller)
- "The ideal state for 1099 season is that we press a button and the report comes out. Today the vendor records simply do not hold the data." (Head of tax)
- "VAT compliance data missing from card transactions and reimbursements" (ticket LT-1038), "tax code assignment process evaluation and accuracy issue" (ticket LT-1065)

It maps to feature-tracker items T-01 (VAT metadata on cards/reimbursements), T-02 (US use-tax vendor data), T-03 (1099/W-8/W-9 data), T-12 (input-VAT account), T-17 (meal/benefit tagging), and T-56 (wrong Sphere tax code applied).

## 2. Non-goals (keep scope tight for a 50-minute build)

- No database. Upload → compute in memory → return files. Nothing persisted server-side beyond the request lifecycle.
- No real Sphere/Light API calls. Rules are hard-coded/config-driven, not fetched live.
- No auth, no multi-user, no history. Single-shot tool.
- No attempt to cover every country's VAT law. Cover SE, US, UK, CH, CA at a "directionally correct, clearly labelled as a starting point" level.
- No LLM call required to function (rules must work standalone), but an optional AI-assist step for ambiguous rows is a stretch goal only if time remains.

## 3. Architecture (no DB, simple to run)

```
┌─────────────┐      upload CSVs       ┌──────────────────┐
│   Browser   │ ─────────────────────▶ │  Express server   │
│  (React UI) │                        │  (Node + TS)       │
│             │ ◀───────────────────── │  in-memory compute │
└─────────────┘   enriched CSV + JSON  └──────────────────┘
```

- **Backend:** Node.js + TypeScript + Express. One POST endpoint `/api/analyze` accepts multipart form-data with two files, runs the rule engine in memory, and returns a JSON payload containing the summary stats and the enriched rows (client renders the table; a "download CSV" button serialises the same rows back to CSV client-side, so the server never writes to disk).
- **Frontend:** React + Vite, single page. File upload widgets (or "use sample data" button that ships with the repo), a "Run tax agent" button, a results dashboard (summary cards + a filterable table), and a CSV download button.
- **Shared types:** a small `types.ts` shared by both rule engine and UI so the table renders whatever fields the engine produces without duplication.

No database, no queue, no auth. This is intentionally the simplest thing that could work.

## 4. Data contracts

### Input: `expenses.csv`

`expense_id, date, entity, country, amount, currency, merchant_name, vendor_id, category, is_card, tax_code, vat_amount`

### Input: `vendors.csv`

`vendor_id, name, country, state, type, category, w9_on_file, w8_on_file`

### Output: `expenses_enriched.csv`

All input columns, plus:
`needs_review (bool), reason (string, semicolon-separated if multiple), suggested_vat_treatment (string), confidence (high|medium|low)`

### Output: summary JSON

```json
{
  "total_expenses": 66,
  "missing_tax_code_pct": 52,
  "missing_vat_amount_pct": 32,
  "us_vendors_missing_state_or_type": 3,
  "us_vendors_missing_w9": 4,
  "expenses_needing_review": 41,
  "by_country": { "SE": {...}, "US": {...}, "UK": {...}, "CH": {...}, "CA": {...} },
  "by_category": { "meal": {...}, "software": {...}, ... }
}
```

## 5. Rule engine — the 5 rules to implement (in priority order)

1. **Missing tax code** — if `tax_code` is empty → `needs_review=true`, reason `"missing tax_code"`, suggested treatment = lookup default code for `(country, category)` from a config table, confidence `medium`.
2. **Cross-entity tax code mismatch** — if `tax_code` exists but its country prefix doesn't match `entity` (e.g. `UK_STANDARD_20` on an `SE` expense) → flag `"tax_code country mismatch — mirrors T-56 Sphere bug"`, suggest the correct-country equivalent code, confidence `high`.
3. **Meal/benefit ambiguity (Sweden-style VAT decision tree)** — if `category` is `meal` or `benefit` and `country == SE` → apply explicit decision tree (see skill file `expense-vat-classification.md`) to output `SE_MEAL_BUSINESS` vs `SE_MEAL_BENEFIT`, flag if current `tax_code` disagrees with the tree's output.
4. **Missing VAT amount on a card/reimbursement** — if `vat_amount` is empty and `is_card=true` or the row is a reimbursement → flag `"VAT compliance data missing from card/reimbursement — mirrors LT-1038"`.
5. **US vendor 1099/use-tax data gap** — join `expenses` to `vendors` on `vendor_id`; if `vendor.country == US` and (`state` empty or `type` empty or `w9_on_file == false`) → flag `"vendor missing state/type/W9 — 1099 season blocker"`, confidence `high`.

Each rule can fire independently; a row can carry multiple reasons (semicolon-joined). `confidence` = `high` if the rule is deterministic (rules 2, 5), `medium` if it's a default fallback (rules 1, 3), `low` if the row also has other data quality issues.

## 6. Build order

1. Scaffold: `npm create vite@latest` (React+TS template) for frontend; `express` + `typescript` + `multer` + `csv-parse`/`papaparse` for backend. Two folders, `client/` and `server/`.
2. Implement the rule engine as a pure function `analyzeExpenses(expenses, vendors, config): { enriched, summary }` with no framework dependencies, so it's unit-testable and reusable. Write 3–4 quick assertions against the sample data while building (see `agents/rule-engine-agent.md`).
3. Wire the Express endpoint: accept two file uploads, parse CSV to JSON, call `analyzeExpenses`, return JSON. Keep everything in memory.
4. Build the React UI: upload/"use sample data" toggle, "Run" button, summary cards, results table with a `needs_review` filter, "Download enriched CSV" button (client-side CSV serialization from the JSON already in state — no extra server round-trip).
5. Smoke test end to end with the provided `expenses.csv` / `vendors.csv`, capture 2–3 screenshots as a fallback if something breaks live, write the README.

## 7. Tech stack summary

- Node.js 24+, TypeScript
- Backend: Express, Multer (file upload), csv-parse
- Frontend: React 19, Vite, MUI
- No database, no ORM, no auth, no external API calls
- Tests: optional, but 3–4 inline assertions on the rule engine are worth the 3 minutes given "evidence over vibes" is explicitly graded

## 8. What you'd harden next (say this explicitly in the README)

- Replace the hard-coded `(country, category) → tax_code` lookup with a config file the finance-systems lead can edit without a deploy.
- Add real Sphere API lookups instead of static defaults for rule 1 and rule 3.
- Persist runs (needs a DB) so the Controller can compare this week's run to last week's and see the % of `needs_review` trending down.
- Add an LLM-assisted "explain this flag in plain English for the vendor" drafting step for ambiguous rows — useful for collections-style outreach, not for the tax decision itself (don't let an LLM invent VAT rules).
- Add role-based read access so an auditor could run this against a locked period without needing write access to Light.

## 9. Files in this package

- `DEVELOPMENT_PLAN.md` — this file
- `expenses.csv` — synthetic input data (66 rows, ~52% missing tax_code, several deliberate edge cases mirroring T-56, LT-1038, LT-1085)
- `vendors.csv` — synthetic vendor master (20 rows, 3 US vendors missing state, 4 missing W-9)
- `.agents/personas/orchestrator-agent.md`
- `.agents/personas/rule-engine-agent.md`
- `.agents/personas/api-agent.md`
- `.agents/personas/ui-agent.md`
- `.agents/skills/csv-data-contracts/SKILL.md`
- `.agents/skills/data-quality-flagging/SKILL.md`
- `.agents/skills/expense-vat-classification/SKILL.md`
- `.agents/skills/react-dashboard-rendering/SKILL.md`
