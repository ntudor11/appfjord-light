# GitHub Copilot Instructions

See [AGENTS.md](../AGENTS.md) at the repo root for full project conventions,
dev environment setup, build/test commands, code style, and security rules.
This file exists only for older Copilot surfaces that don't yet read
`AGENTS.md` directly — keep it short and do not duplicate content from there.

## Copilot-specific notes

- Path-scoped rules live in [.github/instructions/](./instructions/) as
  `*.instructions.md` files with an `applyTo` glob. Copilot applies these
  automatically based on the file you're editing — check there before
  guessing conventions for a specific area (backend, frontend, database).
- Custom chat modes live in [.github/chatmodes/](./chatmodes/). Each one
  corresponds to a persona defined in `.agents/personas/` — if a chatmode is
  empty or missing, check `.agents/personas/` for the underlying definition.
- For deep-dive procedures, check `.agents/skills/` (mirrored conceptually
  from `.claude/skills/`) before improvising a domain-specific task like a
  database migration or auth change.
