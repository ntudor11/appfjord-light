# Skill: React Dashboard Rendering

## Purpose

Gives the UI Agent a concrete, low-decision component breakdown so no time is spent debating layout during the build. Optimises for "looks credible to a CFO in 10 seconds" over comprehensive UX.

## Visual language (match the slide deck)

- Background: dark slate gradient (`#0f172a` → `#1e293b`)
- Cards: `rgba(30, 41, 59, 0.6)` with `backdrop-filter: blur(10px)`, `border-radius: 16px`, subtle border `rgba(148,163,184,0.1)`
- Accent: blue→purple gradient (`#60a5fa` → `#a78bfa`) for headings and primary actions
- Confidence colour coding: `high` = green (`#34d399`), `medium` = amber (`#fbbf24`), `low` = red (`#f87171`)
- Font: system font stack, no custom font loading (keep build simple, no external font requests)

## Component tree

```
App
├── Header (title + one-line description)
├── UploadControls
│     ├── "Use sample data" button
│     └── two file inputs (expenses.csv, vendors.csv) as fallback
├── RunButton (disabled until data is present; shows a spinner while awaiting API)
├── SummaryCards        (only rendered once a result exists)
│     ├── card: Total expenses analysed
│     ├── card: % missing tax_code
│     ├── card: % missing VAT amount
│     ├── card: US vendors missing state/type
│     ├── card: US vendors missing W-9
│     └── card: Expenses needing review (the headline number)
├── FilterToggle          ("show only needs_review" checkbox)
├── ResultsTable
│     └── one row per EnrichedExpense: id, entity, category, amount+currency, tax_code, needs_review badge, reason, suggested_vat_treatment, confidence badge
└── DownloadButton         ("Download enriched CSV" — client-side Blob download)
```

## SummaryCards — data mapping

Pull directly from the `Summary` object (see `skills/csv-data-contracts/SKILL.md`). Order cards by what a Controller would ask first:

1. Expenses needing review (headline, largest/boldest card)
2. % missing tax_code
3. % missing VAT amount
4. US vendors missing state/type
5. US vendors missing W-9
6. Total expenses analysed (context, smallest card)

## ResultsTable — rendering rules

- Sort by `needs_review` descending by default (flagged rows first) — a Controller shouldn't have to hunt for them.
- `needs_review` renders as a small pill: red background if `true`, muted grey if `false`.
- `confidence` renders as a small coloured dot + label using the colour coding above.
- `reason` column: if it contains a semicolon-separated list, render each clause on its own line inside the cell (use `reason.split("; ").map(...)`) rather than one long run-on sentence — this is what makes multi-rule rows scannable.
- Truncate `merchant_name`/`reason` with CSS `text-overflow: ellipsis` and a native `title` tooltip attribute rather than a custom tooltip component — keep it simple.
- Empty state: if `enriched` is empty (shouldn't happen with the sample data, but handle it), show a centred "No data" message instead of an empty table shell.

## Interaction rules

- The "Run tax agent" button should show a loading spinner state and be disabled while the request is in flight — even a fast in-memory call benefits from this for perceived responsiveness.
- The "show only needs_review" toggle filters client-side against the already-fetched `enriched` array — no re-fetch needed.
- The CSV download button constructs the CSV string from the _currently filtered_ view of `enriched` (respect the toggle), not always the full unfiltered set — a Controller who filtered to "needs review only" wants to export exactly that.

## What to explicitly skip (time-box discipline)

- No charts/graphs library (e.g. Recharts) — the summary cards convey the same numbers faster to build and just as clearly to a Controller.
- No pagination — 66 rows renders fine in a plain scrollable table.
- No client-side routing, no global state library — `useState` in `App.tsx` is sufficient.
