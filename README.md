# SomPayKit

Accept **EVC Plus, Zaad, Sahal and eDahab** in your app in minutes.

An open-core payments toolkit for Somalia: a free TypeScript SDK, free shadcn-compatible checkout components, and paid Pro blocks, starters and services.

**Pitch:** Start selling online today with EVC and Zaad, no API fee. Upgrade to automatic payments when you're ready.

## How developers use it

Docs, live component previews and a demo shop: **[sompaykit.dev](https://sompaykit.dev)**.

```bash
# Payment logic (any Node / TypeScript server)
pnpm add @sompaykit/core

# React hooks
pnpm add @sompaykit/react

# Checkout UI, copied into your app (shadcn/ui registry)
npx shadcn@latest add https://sompaykit.dev/r/checkout-form.json
```

**Manual mode works today**, with no merchant account and no API fee: the customer sends money to
your own wallet number (a "Dial to pay" button fills in the USSD code) and types the transaction ID.

```ts
import { createSomPay } from '@sompaykit/core';

const sompay = createSomPay({
  provider: 'manual',
  merchantNumbers: { evc: process.env.EVC_NUMBER!, zaad: process.env.ZAAD_NUMBER! },
});

const result = await sompay.charge({
  referenceId: attemptId, // unique per attempt; a resend returns the same payment
  phone: '061 234 5678',
  amount: order.total, // always from your database, never from the browser
  currency: 'USD',
});
// result.status === 'awaiting_proof'; result.instructions has the number, amount and dial link
```

**Automatic mode** (PIN prompt on the customer's phone) through WaafiPay comes next, after sandbox
testing.

## Free vs paid

| | Free (MIT) | Paid |
|---|---|---|
| `@sompaykit/core` — providers, wallet detection, errors | ✅ | |
| `@sompaykit/react` — hooks | ✅ | |
| Registry: basic checkout + status components | ✅ | |
| **Pro blocks** — full checkout flow, merchant dashboard, settings, RTL | | $79 |
| **Starter app** — complete Next.js + Supabase shop | | $29 / $79 |
| **Done-for-you** integration | | from $249 |
| **SomPay Cloud** — logs, alerts, webhooks (later) | | monthly |

Sold on [aoubak.com](https://aoubak.com) and Whop.

## Local development

Requirements: Node.js 20.11+ (22 recommended) and pnpm 10 (`corepack enable` or `npm i -g pnpm@10`).

```bash
pnpm install          # install all workspace packages
pnpm build            # build every package (tsup → ESM + CJS + .d.ts)
pnpm dev              # rebuild on change
pnpm lint             # ESLint, zero warnings allowed
pnpm typecheck        # strict TypeScript in every package
pnpm test             # Vitest unit tests
pnpm format           # Prettier
pnpm changeset        # describe a change to a published package before merging
```

Layout:

```
packages/core     @sompaykit/core: types, phone, wallets, ussd, errors, providers
packages/react    @sompaykit/react: usePayment, usePaymentStatus
registry/         free shadcn/ui components: checkout form, wallet picker, manual pay, status
apps/docs         sompaykit.dev: docs + the registry at /r/*.json
apps/demo         demo shop (manual mode, no real money)
docs/             product, architecture, payments, design system, roadmap, mockups
```

Work on one package: `pnpm --filter @sompaykit/core test` (or `build`, `typecheck`).

Unconfirmed provider facts (wallet prefixes, USSD codes, WaafiPay fields) all live in
`packages/core/src/constants.ts`, each marked `TODO(VERIFY)`.

## Docs

| File | What's inside |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Monorepo, packages, registry, release pipeline, security |
| [docs/PAYMENTS.md](docs/PAYMENTS.md) | Manual + automated flows, provider interface, edge cases |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, type, components, RTL, accessibility |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phase-by-phase build plan |
| [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) | Rules for AI coding agents |

## Status

Phase 2, the free toolkit: core SDK, React hooks, components, docs and demo are built. Next: first
npm release (`0.1.0`), sompaykit.dev launch, then WaafiPay automatic mode. See
[docs/ROADMAP.md](docs/ROADMAP.md).

## Contributing

Somali developers are especially welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

- `packages/core`, `packages/react`, free registry items: **MIT**
- `pro/` and `apps/starter`: **commercial** (not published to npm)

© Aoub — [aoubak.com](https://aoubak.com)
