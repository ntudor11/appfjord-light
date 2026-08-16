# Personas

This folder is intentionally empty. It is the **canonical source** for
specialized agent roles (e.g. `reviewer.md`, `tester.md`, `architect.md`,
`db-migrator.md`).

## Suggested frontmatter when you add one

```markdown
---
name: db-migrator
description: Writes and reviews PostgreSQL migrations safely
model: claude-sonnet-4-5
tools: [read, write, bash]
---

# DB Migrator

Read @../context/architecture.md and @../skills/postgres-migrations/SKILL.md
before making changes.
```

## Guidance for any AI reading this while the folder is still empty

No specialized roles have been defined yet. Do not act as an undefined
persona — fall back to [AGENTS.md](../../AGENTS.md) and
[.agents/context/](../context/) for general-purpose instructions instead.
