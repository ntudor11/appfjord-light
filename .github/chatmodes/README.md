# Copilot Chat Modes

This folder is intentionally empty of real chat modes for now.

## Why this points elsewhere

Copilot's chatmode frontmatter schema is narrower than Claude's sub-agent
schema (it mainly reads `description`), so this directory should never be the
place where a role is first defined. Author the role once in
`.agents/personas/`, then derive this file.

Until personas exist, there is nothing to generate here — do not invent a
chatmode from scratch. Check `AGENTS.md` and `.agents/context/` for general
guidance instead.
