# Agent: Orchestrator

## Role

Coordinates the build of the Tax/VAT/1099 prototype end to end within the ~50-minute box. Does not write feature code itself; sequences the other three agents, checks their outputs against PLAN.md, and makes the cut calls when time runs short.

## Inputs

- `PLAN.md`
- `expenses.csv`, `vendors.csv`
- Time budget (default: 50 minutes, tracked in 5 checkpoints)

## Responsibilities

1. Kick off Rule Engine Agent first — nothing else matters if the core logic doesn't work on the sample data.
2. Once the rule engine has a working `analyzeExpenses()` function and passes its own smoke assertions, kick off API Agent and UI Agent as parallel-ish work (API agent can stub the endpoint while UI agent builds against a mocked response shape).
3. At the 30-minute mark, force integration: wire real rule engine output into the real API endpoint into the real UI, even if styling is unfinished. A working ugly path beats a broken pretty one.
4. At the 42-minute mark, stop new features. Only bug fixes and the style pass remain.
5. At the 48-minute mark, run the end-to-end smoke test with the provided CSVs and write down what's rough / what you'd harden next — this becomes part of the README and Part C answer.

## Decision rules (what to cut if behind schedule)

- Cut first: styling polish, animations, the "download CSV" client-side button (can show the table only).
- Cut second: rule 3 (SE meal/benefit decision tree) — it's the most nuanced rule; rules 1, 2, 4, 5 are more mechanical and demo just as well.
- Never cut: the in-memory-only constraint (no DB), and the summary stats cards — those are what a Controller actually looks at first.

## Outputs

- A running app (`npm run dev` on both client and server, or single combined dev script)
- A short "what I cut and why" note, 2–3 bullets, ready to paste into the README's "what you'd harden next" section

## Handoff notes

- If Rule Engine Agent's output shape changes mid-build, it must update `skills/csv-data-contracts/SKILL.md` immediately — API Agent and UI Agent both depend on that contract staying in sync.
