# Skill: CSV Data Contracts

## Purpose
Defines the exact field names, types, and shapes that flow between the CSV files, the rule engine, the API, and the UI. Every agent should treat this as the single source of truth — if a field needs to change, update this file first, then propagate.

## `expenses.csv` — input

| Field | Type | Notes |
|---|---|---|
| `expense_id` | string | e.g. `EXP-0001` |
| `date` | string (ISO `YYYY-MM-DD`) | |
| `entity` | string | one of `SE, US, UK, CH, CA` — the Appfjord legal entity the expense belongs to |
| `country` | string | usually equals `entity`; kept separate because a transaction can occur in a different country than the booking entity |
| `amount` | number | in `currency` |
| `currency` | string | ISO code, e.g. `SEK`, `USD`, `GBP`, `CHF`, `CAD` |
| `merchant_name` | string | free text |
| `vendor_id` | string, nullable | foreign key into `vendors.csv`; empty string if no vendor match |
| `category` | string | one of `meal, travel, software, office_supplies, professional_services, benefit, rent` |
| `is_card` | string `"true"/"false"` | card transaction vs reimbursement |
| `tax_code` | string, nullable | current tax code on the transaction; empty string if never set |
| `vat_amount` | number, nullable | empty string if not calculated/present |

## `vendors.csv` — input

| Field | Type | Notes |
|---|---|---|
| `vendor_id` | string | primary key, e.g. `V-001` |
| `name` | string | |
| `country` | string | |
| `state` | string, nullable | only meaningful for `country == US`; empty string if missing |
| `type` | string, nullable | `individual` or `corporation`; empty string if missing |
| `category` | string | `software, services, meals, travel, goods, rent` |
| `w9_on_file` | string `"true"/"false"` | US vendors only, relevant to 1099 |
| `w8_on_file` | string `"true"/"false"` | non-US vendors, relevant to 1042/W-8 |

## `EnrichedExpense` — output (TypeScript shape)

```ts
interface EnrichedExpense extends Expense {
  needs_review: boolean;
  reason: string;          // semicolon-separated if multiple rules fired, human-readable
  suggested_vat_treatment: string;
  confidence: "high" | "medium" | "low";
}
```

## `Summary` — output (TypeScript shape)

```ts
interface Summary {
  total_expenses: number;
  missing_tax_code_pct: number;
  missing_vat_amount_pct: number;
  us_vendors_missing_state_or_type: number;
  us_vendors_missing_w9: number;
  expenses_needing_review: number;
  by_country: Record<string, { total: number; needs_review: number }>;
  by_category: Record<string, { total: number; needs_review: number }>;
}
```

## Parsing rules (apply in both CLI and API paths)

- Empty CSV cells parse to empty string `""`, not `null` or `undefined` — keep comparisons simple (`value === ""`).
- `is_card`, `w9_on_file`, `w8_on_file` arrive as the literal strings `"true"`/`"false"` from CSV — convert to real booleans immediately after parsing, before they reach the rule engine.
- `amount` and `vat_amount` must be coerced to `number` on parse; treat `vat_amount === ""` as "missing," not `0` — these are semantically different (a legitimately zero-VAT transaction vs. one that was never calculated).
- Never mutate the parsed input arrays in place — rule functions should read from `Expense`/`Vendor` and return new `EnrichedExpense` objects.
