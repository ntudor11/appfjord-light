# Skill: Expense VAT Classification

## Purpose
Encodes the "decision tree for expense VAT" that the Group Financial Controller explicitly said doesn't exist today ("Nothing works out that this is a meal in Sweden and needs this treatment. We do all of that manually."). This skill is deliberately simple and explainable — it is a starting point, not a finished tax engine, and the README must say so.

## Scope for the prototype
Cover only the cases present in the sample data: Sweden meals/benefits (the quote's exact example), plus a generic default-lookup fallback for the other four entities so every row gets *some* suggested treatment.

## Rule: Sweden meal/benefit decision tree

Given an expense with `country == "SE"` and `category` in `{"meal", "benefit"}`:

1. If `category == "benefit"` → suggested treatment is `SE_MEAL_BENEFIT` (benefits in kind are typically non-deductible / different VAT treatment than a genuine business meal).
2. If `category == "meal"`:
   - If `merchant_name` matches a known catering/meal-delivery vendor pattern (e.g. contains "Catering", "Meal", "Delivery") **and** `amount` is below a modest per-head threshold (use `500 SEK` as the prototype's placeholder threshold) → suggest `SE_MEAL_BUSINESS` (ordinary business meal, standard deductible treatment).
   - Otherwise → suggest `SE_MEAL_BUSINESS` but mark `confidence: "low"` and add to `reason`: "meal classification uncertain — verify headcount/purpose with employee."
3. Compare the suggested code to the transaction's current `tax_code`:
   - If they match → no flag from this rule.
   - If they differ or `tax_code` is empty → flag `needs_review = true`, add reason `"SE meal/benefit VAT treatment does not match decision tree output"`.

This directly operationalises the Controller's quote and is worth calling out by name in the CFO-facing README/demo script.

## Rule: default lookup fallback (all other entity/category combinations)

For any expense not covered by the Sweden meal/benefit tree, look up a default tax code from a flat config table keyed by `(country, category)`:

| Country | Category | Default tax code |
|---|---|---|
| US | software | `US_STANDARD` |
| US | professional_services | `US_USE_TAX` |
| US | meal | `US_STANDARD` |
| US | travel | `US_EXEMPT` |
| US | office_supplies | `US_STANDARD` |
| UK | software | `UK_STANDARD_20` |
| UK | professional_services | `UK_STANDARD_20` |
| UK | meal | `UK_STANDARD_20` |
| UK | travel | `UK_ZERO_RATED` |
| CH | professional_services | `CH_STANDARD_81` |
| CH | rent | `CH_REDUCED_26` |
| CH | software | `CH_STANDARD_81` |
| CA | professional_services | `CA_GST_5` |
| CA | software | `CA_GST_5` |
| CA | office_supplies | `CA_HST_13` |

If no entry exists for the exact `(country, category)` pair, suggest the country's most common default (`_STANDARD`-style code) and set `confidence: "low"`.

## Explicit non-goals (say this out loud in the demo)

- This is not a substitute for Sphere or real tax advice — it is a triage layer that tells the finance team *where to look*, not a final VAT determination.
- No reverse-charge, cross-border B2B VAT logic, or partial-exemption calculations are modelled. Flag these as future scope in the README.
- Thresholds (like the `500 SEK` meal cutoff) are illustrative placeholders — call this out explicitly so nobody mistakes it for a real policy number.
