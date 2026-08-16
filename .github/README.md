# Agentic Repo Template

A framework-agnostic scaffold for working with Claude Code, OpenAI Codex,
Gemini CLI, and GitHub Copilot in the same repository, without duplicating
instructions four times.

## The rule

`.agents/` is the **only** place you hand-write agent instructions, personas,
and skills. Everything under `.claude/agents/`, `.claude/commands/`,
`.claude/skills/`, and `.github/chatmodes/` is **generated** by

`AGENTS.md` at the repo root is the **only** place you hand-write the general
project overview. `CLAUDE.md`, `GEMINI.md`, and
`.github/copilot-instructions.md` are thin pointers back to it.

## What's already filled in

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` —
  pointer/entry files, ready to use.
- `.github/instructions/*.instructions.md` — path-scoped Copilot rules
  (backend, frontend, database) with placeholder content to adapt.
- `.agents/context/` — architecture, conventions, tech stack, glossary
  starter files.
- `.agents/workflows/` — `session-start.md`, `session-end.md`,
  `add-feature.md` starter procedures.
  machinery, plus `.github/workflows/sync-agents.yml` to run it in CI.

## What's intentionally empty

- `.agents/personas/` — no roles defined yet (add `reviewer.md`,
  `tester.md`, `architect.md`, `db-migrator.md`, etc. as you need them).
- `.agents/skills/` — no domain skills written yet (add
  `jwt-auth/SKILL.md`, `postgres-migrations/SKILL.md`, etc. as you need them).
- `.claude/agents/`, `.claude/commands/`, `.claude/skills/`,
  `.github/chatmodes/` — will populate automatically once you run

Each empty folder has a `README.md` inside it that tells any AI agent
exactly where to look instead — back to `AGENTS.md` and `.agents/context/` —
so nothing is ever a dead end.

## Getting started

1. Fill in the placeholders in `AGENTS.md` and `.agents/context/*.md` with
   your actual project details.
2. Add your first persona in `.agents/personas/`, e.g. `reviewer.md`.
3. Commit everything. The GitHub Action keeps derived files in sync on future
   pushes to `.agents/**`.
