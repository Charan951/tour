---
description: Check logs.md for a feature/task and add an entry if missing
argument-hint: <feature name> — <task name>
---

Follow the **Workflow: logs.md** section of the root `CLAUDE.md`.

1. Read `logs.md` at the repo root.
2. Search it for: `$ARGUMENTS`
   - **Found** — summarize the existing entry (status, prior decisions, files, outcome)
     and continue from that state. Do not redo settled work.
   - **Not found** — append a new entry to the top of the "Entries (newest first)" list
     using the current date and time:

     ```
     ### <YYYY-MM-DD HH:MM> — <Feature name> — <Task name>
     - Status: In progress
     - Request: <one line from the user>
     - Files/areas: <fill in as you learn them>
     - Outcome: <update on completion>
     ```
3. Proceed with the work. When done or paused, update `Status` and `Outcome`.
4. If the change is architecturally significant, also update `MEMORY.md`.
