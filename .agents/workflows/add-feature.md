# Add Feature

Standard procedure for adding a new feature to this codebase.

1. Read [AGENTS.md](../../AGENTS.md) and relevant files in [.agents/context/](../context/) for the affected area.
2. Check [.agents/skills/](../skills/) for a matching domain skill (e.g. auth, migrations) before writing code — follow it if one exists.
3. Run `npm lint && npm test` (and `npm test:e2e` if the change touches user-facing flows).
