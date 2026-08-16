# CLAUDE.md

@AGENTS.md

This file exists only because Claude Code looks for `CLAUDE.md` before it
falls back to `AGENTS.md`. The import line above pulls in the real
instructions — do not duplicate content here.

## Claude-specific notes
- Sub-agents live in `.claude/agents/`. Each one is generated from
  `.agents/personas/` — if you need a new specialized agent, add the persona
  there first, then sync it, rather than creating one directly in `.claude/agents/`.
- Deep-dive procedural knowledge lives in `.claude/skills/`, generated from
  `.agents/skills/`. Load a skill only when the current task matches its domain.
- Slash commands in `.claude/commands/` are generated from `.agents/workflows/`.
- If `.claude/agents/`, `.claude/skills/`, or `.claude/commands/` are empty,
  it means no personas/skills/workflows have been authored yet — check
  `.agents/` and AGENTS.md for the current state of the project instead of
  inventing behavior.
