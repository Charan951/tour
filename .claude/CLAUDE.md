# .claude/

Project configuration for Claude Code. The **canonical project guide is the root
[`../CLAUDE.md`](../CLAUDE.md)** (auto-loaded by Claude Code); this file is the index for the
`.claude/` tooling directory.

## Layout

```
.claude/
├── CLAUDE.md        # this index
├── settings.json    # shared, committed project settings (permissions, env)
├── commands/        # slash commands  ->  /<filename>
│   ├── dev.md
│   ├── build.md
│   ├── seed.md
│   └── log-feature.md
├── agents/          # subagents (Task tool)  ->  subagent_type: <name>
│   ├── api-route-builder.md
│   └── mongoose-model-reviewer.md
└── skills/          # skills (Skill tool)  ->  /<skill-name>
    └── add-api-route/
        └── SKILL.md
```

## Related root files

- [`../CLAUDE.md`](../CLAUDE.md) — architecture, commands, and the **logs.md pre-work workflow**.
- [`../MEMORY.md`](../MEMORY.md) — durable architecture / decisions.
- [`../logs.md`](../logs.md) — append-only work history; read before every feature/task.
- `../CLAUDE.local.md` — personal machine-local notes (git-ignored).

## Conventions

- Commands are thin: they state intent and defer to root `CLAUDE.md` / package scripts.
- Agents get only the context they need; they must respect `MEMORY.md` decisions.
- New skills live in their own folder as `skills/<name>/SKILL.md` with YAML frontmatter.
