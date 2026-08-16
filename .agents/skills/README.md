# Skills

This folder is intentionally empty. It is the **canonical source** for
domain-specific, load-on-demand procedural guides — things like
`jwt-auth/SKILL.md` or `postgres-migrations/SKILL.md`.

## Structure when you add one

```
skills/
└── <skill-name>/
    ├── SKILL.md       # required: metadata + core instructions, <500 lines
    ├── scripts/        # optional: executable helper scripts
    ├── references/     # optional: schemas, cheatsheets
    └── assets/         # optional: templates used in output
```

## How this fits into the whole repo

Copilot and Gemini don't have
a native "skills" concept yet, so they should be pointed at this folder
directly via AGENTS.md / GEMINI.md / copilot-instructions.md rather than a
derived copy.

## Guidance for any AI reading this while the folder is still empty

No skills have been written yet for this repo. If a task looks like it needs
a domain-specific procedure (auth changes, DB migrations, etc.), say so and
fall back to [AGENTS.md](../../AGENTS.md) and
[.agents/context/](../context/) rather than improvising a risky procedure
like a schema migration.
