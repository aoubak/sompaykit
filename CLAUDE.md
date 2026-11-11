# CLAUDE.md

Project: **SomPayKit** — open-core Somali payments toolkit (EVC Plus, Zaad, Sahal, eDahab).

Follow every rule in [AGENTS.md](AGENTS.md). Read the docs it lists before writing code.

## Working style

- Work phase by phase as in `docs/ROADMAP.md`. Tick checkboxes as you complete them.
- Before a large change, outline the plan briefly, then build.
- Keep the owner informed with short summaries, not long logs.
- Prefer clean architecture, TypeScript strict, MVP-first. Avoid over-engineering.

## Commands

```bash
pnpm install
pnpm dev          # all apps
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm changeset    # before merging changes to published packages
```
