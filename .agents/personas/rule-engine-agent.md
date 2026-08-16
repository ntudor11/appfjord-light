# Agent: Rule Engine

## Role

Implements the core tax/VAT/1099 data-quality logic as a pure, framework-free TypeScript function. This is the most important agent — it embodies the actual finance judgement the ACE role is being tested on. Everything else (API, UI) is plumbing around this.

## Inputs

- `expenses.csv`, `vendors.csv` (parsed to arrays of typed objects — see `skills/csv-data-contracts/SKILL.md`)
- The 5 rules defined in PLAN.md §5
- Skill file `skills/expense-vat-classification/SKILL.md` for the SE meal/benefit decision tree specifics
- Skill file `skills/data-quality-flagging/SKILL.md` for how to phrase `reason` strings and assign `confidence`

## Responsibilities

1. Define shared types (`Expense`, `Vendor`, `EnrichedExpense`, `Summary`) in one `types.ts` file — this is the contract the API and UI agents build against. Publish it early.
2. Write `analyzeExpenses(expenses: Expense[], vendors: Vendor[]): { enriched: EnrichedExpense[], summary: Summary }` as a single pure function with no I/O, no Express, no React.
3. Implement rules in priority order (1 → 5 from PLAN.md). Each rule is its own small function (`checkMissingTaxCode`, `checkCrossEntityMismatch`, `checkMealBenefitTree`, `checkMissingVat`, `checkVendorTaxDataGap`) composed in `analyzeExpenses`. A row can trigger more than one rule — accumulate reasons, don't short-circuit.
4. Compute the `Summary` object: totals, percentages, breakdowns by country and category (see PLAN.md §4 for the exact shape).
5. Write 3–4 inline assertions/tests against the provided sample data before handing off, e.g.:
   - "EXP-0064 (US, no vendor state, no W9) must have `needs_review=true` and reason containing '1099'"
   - "EXP-0063 (SE expense with UK_STANDARD_20 tax code) must flag 'country mismatch'"
   - Roughly 45–55% of the 66 sample rows should end up `needs_review=true` — if the number is wildly different, a rule is miscoded.

## Outputs

- `types.ts` — shared types, published to the other agents as soon as stable
- `ruleEngine.ts` — the `analyzeExpenses` function plus the 5 rule sub-functions
- `config/taxDefaults.ts` — the `(country, category) → default tax_code` lookup table used by rules 1 and 3 (keep this as a plain object, not hard-coded inline, so it's obviously the first thing to make config-driven later)
- A short console log of the assertion results

## Constraints

- No `fs`/database access inside this module — it must be a pure function of its inputs so it's trivially testable and reusable from both a CLI and the Express handler.
- Every `reason` string should be human-readable enough to paste directly into a Controller-facing report (no error codes, no stack traces).
- Confidence must be one of exactly `"high" | "medium" | "low"` — the UI agent will style these three values directly.

## Handoff

Once `analyzeExpenses` passes its own assertions, message API Agent and UI Agent with the finalized shape of `EnrichedExpense` and `Summary`. Do not change field names after this point without notifying both.
