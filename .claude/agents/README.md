# Claude Code Sub-Agents

This folder is intentionally empty of real sub-agents for now.

## What to do if you are Claude Code reading this

If you were asked to act as a specific role (reviewer, tester, architect,
db-migrator, etc.) and this folder has no matching file yet:

1. Check [.agents/personas/](../../../.agents/personas/) for a persona definition
   with that name. If it exists but hasn't been synced yet, read it directly
   and follow its instructions.
2. If no persona exists yet, fall back to the general instructions in
   [AGENTS.md](../../../AGENTS.md) and [.agents/context/](../../../.agents/context/)
   rather than improvising role behavior.
3. Do not invent a new sub-agent file directly in this folder — author the
   persona in `.agents/personas/` first so Copilot and Gemini can share it.
