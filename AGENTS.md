# AGENTS.md

Rules for AI coding agents (Claude Code, Cursor, Copilot) working in this repo.

## Read first

- `docs/ARCHITECTURE.md` — monorepo, packages, public API, security
- `docs/PAYMENTS.md` — provider interface, flows, edge cases
- `docs/DESIGN-SYSTEM.md` — tokens, components, RTL
- `docs/ROADMAP.md` — what phase we're in; don't build ahead of it
- `docs/mockups/` — approved UI screens (Phase 2 and 3 visual reference)

## Hard rules

1. `packages/core` has **zero runtime dependencies** and uses only `fetch`. No Node-only APIs.
2. **Never** expose gateway credentials to the client. No `NEXT_PUBLIC_` prefix on any payment secret.
3. **Never** trust client-sent amounts. Apps recalculate totals server-side.
4. Every provider implements `PaymentProvider` from `packages/core/src/types.ts`. No provider-specific branching outside `providers/`.
5. Every charge requires a unique `referenceId`. Repeated calls must be idempotent.
6. Never log credentials or full phone numbers.
7. Anything marked **VERIFY** in docs must not be presented as confirmed. Keep it in one constant so it's easy to update.
8. Code under `pro/` is commercial: never import it from `packages/` or `registry/`.

## Code style

- TypeScript strict; no `any`.
- Small pure functions in core; easy to unit test.
- UI: shadcn/ui themed via CSS variables — no hard-coded colors.
- Sans-serif fonts only (Geist / DM Sans; IBM Plex Sans Arabic for Arabic).
- Logical CSS properties only (`ms-`, `pe-`, `start-`) for RTL.
- User-facing strings in locale files (so/en/ar), never inline.

## Adding a provider

1. `packages/core/src/providers/<name>.ts` implementing `PaymentProvider`.
2. Map error codes in `errors.ts` (so/en/ar).
3. Register in `createSomPay()`.
4. Tests for success, decline, timeout, duplicate reference (mock `fetch`).
5. Add a changeset.

## Workflow

- Run `pnpm lint && pnpm typecheck && pnpm test` before finishing a task.
- Add a changeset for any change to a published package.
- Never call real production gateway endpoints in tests.
