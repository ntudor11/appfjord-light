# GEMINI.md

This file exists so Gemini CLI has a discoverable entry point. The
authoritative instructions live in [AGENTS.md](./AGENTS.md) at the repo root —
read that file first for project overview, dev environment, build/test
commands, code style, and security rules.

## Gemini-specific notes
- Prefer reading `AGENTS.md` directly. This repo also sets
  `.gemini/settings.json` -> `context.fileName: "AGENTS.md"` so Gemini CLI
  loads it automatically without needing this file at all.
- For domain-specific procedures, check `.agents/skills/` before attempting
  a task from scratch — if a relevant `SKILL.md` exists, follow it.
- For named specialized roles (reviewer, tester, architect, db-migrator, etc.),
  check `.agents/personas/` for the current definition and constraints before
  acting in that capacity.
