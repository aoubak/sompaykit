# Architecture

## Principles

- **Core is framework-agnostic.** Plain TypeScript, `fetch` only, zero runtime dependencies. Runs in Node, Bun, edge and serverless.
- **Server-only secrets.** Gateway keys never reach the browser.
- **Adapters over conditionals.** Every provider implements one interface.
- **Small, typed, tested.** Strict TypeScript, Zod at boundaries in apps, Vitest everywhere.

## Monorepo

pnpm workspaces + Turborepo.

```
sompaykit/
├─ packages/
│  ├─ core/            @sompaykit/core   (MIT, npm)
│  │  └─ src/
│  │     ├─ index.ts           createSomPay()
│  │     ├─ types.ts           PaymentProvider, inputs, results, statuses
│  │     ├─ phone.ts           normalize + validate Somali numbers
│  │     ├─ wallets.ts         prefix → wallet detection
│  │     ├─ errors.ts          error codes + so/en/ar messages
│  │     ├─ ussd.ts            manual-mode dial links
│  │     └─ providers/
│  │        ├─ manual.ts
│  │        ├─ waafipay.ts
│  │        └─ sifalopay.ts
│  └─ react/           @sompaykit/react  (MIT, npm)
│     └─ src/  usePayment(), usePaymentStatus()
├─ registry/           shadcn registry source (MIT, free items)
│  ├─ checkout-form/
│  ├─ wallet-picker/
│  ├─ manual-pay-card/
│  └─ payment-status/
├─ apps/
│  ├─ docs/            sompaykit.dev — docs + serves /r/*.json registry
│  └─ demo/            live demo shop
├─ pro/                 PRIVATE — never published to npm
│  ├─ blocks/          full checkout flow, dashboard, settings
│  └─ starter/         complete Next.js + Supabase shop
├─ .changeset/
├─ turbo.json
└─ pnpm-workspace.yaml
```

> `pro/` lives in a **separate private repo** (`sompaykit-pro`) once the public repo goes open source. Keep it here only during early private development.

## Packages

| Package | Build | Output |
|---|---|---|
| `@sompaykit/core` | tsup | ESM + CJS + `.d.ts` |
| `@sompaykit/react` | tsup | ESM + CJS + `.d.ts`, `react` as peer dep |

Exports use the `exports` field; `sideEffects: false` for tree-shaking.

## Public API (core)

```ts
const sompay = createSomPay({ provider: "waafipay", credentials, environment: "sandbox" });

sompay.charge(input)              // → ChargeResult
sompay.status(referenceId)        // → PaymentStatus
sompay.detectWallet(phone)        // → Wallet | null
sompay.normalizePhone(phone)      // → "2526…"
sompay.message(code, locale)      // → localized error text
```

Manual mode:

```ts
const manual = createSomPay({ provider: "manual", merchantNumbers: { evc: "61XXXXXXX" } });
manual.charge(input)
// → { referenceId, status: "awaiting_proof",
//     instructions: { wallet, number, amount, currency, ussdCode, ussdLink } }
```

Error handling: bad input or setup (phone, amount, currency, referenceId, wallet) throws
`SomPayError` with a `code` before any payment is attempted. Payment outcomes (declined,
insufficient funds, timeout) come back as `{ status: "failed", errorCode }`. Either way, show
customers `sompay.message(code, locale)`.

Unconfirmed provider facts live in `packages/core/src/constants.ts` (one place, `TODO(VERIFY)`).

## Registry (shadcn)

- Source in `registry/` (`registry.json` + `src/`, laid out like a shadcn project with the `@/` alias).
- `pnpm --filter @sompaykit/registry build` writes `registry/dist/r/*.json` in the `shadcn build`
  format; the docs app copies it to `public/r/`. Own script instead of `shadcn build`, so the theme
  comes from `src/styles/sompaykit.css` and builds need no extra download.
- Items: `sompaykit-base` (theme cssVars, so/en/ar strings, formatters, icons), `wallet-picker`,
  `checkout-form`, `manual-pay-card`, `payment-status`. Every component pulls in `sompaykit-base`.
- Install: `npx shadcn@latest add https://sompaykit.dev/r/checkout-form.json`
- Components depend on `@sompaykit/core` / `@sompaykit/react` (declared in each item's `dependencies`)
  and shadcn's `button` / `input` (`registryDependencies`). `src/components/ui/*` and `src/lib/utils.ts`
  are local stand-ins for typecheck and tests only; they are not published.
- Tests check that every import in an item is installed with it.
- Pro blocks are **not** in the public registry; buyers get them from the private repo.

## Hosting

| What | Where | Notes |
|---|---|---|
| `apps/docs` (sompaykit.dev) | Cloudflare Pages, free plan | Fully static export: docs pages + registry `/r/*.json`. No server code, so it can move to any static host without changes. |
| `apps/demo` | Cloudflare Pages + Workers, free plan | Server-side total calculation runs in a Worker / Pages Function. Manual mode only; no real gateway keys. |
| Starter app (paid) | The buyer's own account | Not hosted by us. |

- Domain `sompaykit.dev` (owner buys it). `.dev` requires HTTPS; Cloudflare provides it.
- Keep app code host-neutral (no platform-only APIs), so moving to Vercel Pro later is a config change.

## Release pipeline

- Changesets for versioning + changelogs.
- GitHub Actions: lint → typecheck → test → build on every PR.
- Publish to npm from Actions on merge to `main`, with **npm provenance**.
- SemVer. Breaking changes only in majors.

## Security checklist

- [ ] No payment secret ever uses `NEXT_PUBLIC_*`
- [ ] Core never logs credentials or full phone numbers
- [ ] Amounts recalculated server-side in apps; core never trusts client totals
- [ ] `referenceId` required on every charge (idempotency)
- [ ] Callback verification per provider docs
- [ ] RLS on all starter tables; dashboard requires merchant role
- [ ] Proof screenshots in a private bucket, signed URLs only
- [ ] Raw gateway responses stored for disputes
- [ ] Dependabot + `pnpm audit` in CI
