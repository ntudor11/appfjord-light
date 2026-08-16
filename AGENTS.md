# AGENTS.md

This is the universal instruction file read natively by OpenAI Codex, Gemini CLI,
and GitHub Copilot, and imported by Claude Code via `CLAUDE.md`. Every AI coding
tool working in this repo should treat this file as the starting map. Keep it
short — anything long-form belongs in `.agents/context/`, `.agents/skills/`, or
`.agents/personas/`, linked from here.

## Project overview

For the full details, consult [./agents/context/DEVELOPMENT_PLAN.md](./.agents/context/DEVELOPMENT_PLAN.md)

## Dev environment

- Node 24+, package manager: npm
- Install: `npm install`
- Run dev servers: `npm dev`

## Build & test

- `npm lint` — ESLint + TypeScript check

## Where to look for more context

- Architecture & conventions: [.agents/context/](.agents/context/)
- Domain-specific how-tos (loaded on demand): [.agents/skills/](.agents/skills/)
- Named roles for specialized work: [.agents/personas/](.agents/personas/)
- Multi-step procedures: [.agents/workflows/](.agents/workflows/)
- Past decisions (don't relitigate these): [.agents/memory/decisions/](.agents/memory/decisions/)

## Code style

- Strict TypeScript, no `any` without a justification comment
- Prefer named exports; colocate tests as `*.test.ts`

## Security

- Never log tokens, secrets, or PII

## PR instructions

- Title format: `[area] Summary`, e.g. `[auth] Add refresh token rotation`
- Must pass `npm run lint && npm run test` before requesting review
