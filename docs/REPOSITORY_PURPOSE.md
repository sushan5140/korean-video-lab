# Why This Repository Exists

This repository is intended to solve the conversation-length problem.

Future chats should not need to carry the full historical Haneul Video Lab conversation.

Instead, durable project context should live here and be read once at the beginning of a continuation session.

## Memory files

- `AGENTS.md` — behavior and engineering rules
- `docs/PROJECT_RULES.md` — durable product constraints
- `docs/CURRENT_STATE.md` — latest known production state
- `docs/CONTINUATION.md` — compact startup handoff

## Maintenance policy

After significant implementation or deployment work, update the durable memory rather than appending chat logs.

Keep memory concise, current, and implementation-relevant.
