# Skill: Data Quality Flagging

## Purpose
Standardises how the rule engine writes `reason` strings and assigns `confidence`, so the output reads like something a Controller could paste into a report rather than raw debug output. Consistency here is what makes the artefact feel "field-fixable" rather than "engineer's scratchpad."

## Reason string conventions

- Always plain English, present tense, no error codes: `"missing tax_code"` not `"ERR_NO_TAXCODE"`.
- If a rule ties back to a real ticket or feature-tracker item, name it in parentheses — this is what lets you defend the artefact in the debrief: `"tax_code country mismatch (mirrors T-56 Sphere bug)"`.
- If multiple rules fire on one row, join reasons with `"; "` in the order the rules ran (missing tax code → cross-entity mismatch → meal/benefit tree → missing VAT → vendor gap). Don't deduplicate overlapping concerns — seeing "missing tax_code; VAT compliance data missing" on the same row is itself a useful signal (this row has no tax data at all).

## Confidence assignment

| Confidence | When to use |
|---|---|
| `high` | The rule is deterministic and unambiguous — e.g. tax_code's country prefix literally doesn't match the entity (rule 2), or a US vendor record is provably missing a required 1099 field (rule 5). |
| `medium` | The rule applied a fallback/default because no explicit data existed — e.g. missing tax_code got a looked-up default (rule 1), or the Sweden meal tree matched a known pattern (rule 3, first branch). |
| `low` | The rule had to guess with weak signal — e.g. meal classification uncertain (rule 3, second branch), or no `(country, category)` entry existed in the default lookup table. |

Never assign `high` confidence to a suggested treatment the tool invented from a fallback table — `high` is reserved for cases where the *problem* is certain, even if the *fix* still needs a human to confirm.

## `needs_review` boolean

- `true` if any rule fired.
- `false` only if the row passed all five checks cleanly (has a tax_code matching its entity, has a VAT amount if it's a card/reimbursement, and if a vendor is linked, that vendor has complete US tax data when applicable).
- Never set `needs_review = false` just because a fallback default was applied — a fallback still means a human should confirm it (that's the whole point of the tool).

## Summary-level aggregation conventions

- Percentages in `Summary` (e.g. `missing_tax_code_pct`) are rounded to the nearest whole number — Controllers skim these, decimals add noise.
- `by_country` and `by_category` breakdowns always include every value present in the input data, even if `needs_review` is 0 for that group — an empty/clean group is itself useful evidence ("UK has zero flags, focus elsewhere").
- Never silently drop a row for having unparseable data — if a row can't be classified at all, still include it in `enriched` with `needs_review: true`, `confidence: "low"`, and reason `"row could not be fully parsed — check source data"`.
