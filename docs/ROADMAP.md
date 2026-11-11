# Roadmap

## Phase 0 — Setup & verify (week 1)

- [x] Monorepo: pnpm + Turborepo, strict TS, ESLint, Prettier, Vitest, Changesets
- [ ] Reserve npm scope `@sompaykit` and domain `sompaykit.dev`
- [ ] WaafiPay + SifaloPay sandbox access; confirm merchant requirements and fees
- [ ] **VERIFY** wallet prefixes and USSD codes (all collected in `packages/core/src/constants.ts`)

## Phase 1 — Core SDK (weeks 1–3)

- [x] `types.ts`, `createSomPay()`
- [x] `phone.ts`, `wallets.ts`, `ussd.ts`, `errors.ts` (so/en/ar) — fully unit tested
- [x] Manual provider
- [ ] WaafiPay provider (sandbox-tested) — stub with interface + TODO; waiting for sandbox keys
- [ ] Publish `@sompaykit/core@0.1.0` to npm

## Phase 2 — React + free registry + docs (weeks 3–5)

- [x] `@sompaykit/react`: `usePayment`, `usePaymentStatus`
- [x] Registry: `checkout-form`, `wallet-picker`, `manual-pay-card`, `payment-status` — built to `registry/dist/r`; real `shadcn add` test pending the docs host
- [ ] Docs site on sompaykit.dev (Fumadocs or Nextra) serving `/r/*.json` — static export, hosted on Cloudflare Pages (free)
- [ ] Demo shop + 30-second demo video — shop built and tested in `apps/demo` (manual mode, payments confirm themselves); video and first Cloudflare deploy pending
- [ ] Public launch: npm, GitHub, Somali dev communities

## Phase 3 — Paid products (weeks 5–8)

- [ ] Pro blocks from approved mockups: full checkout flow, merchant orders dashboard, payment settings, Arabic RTL
- [ ] Starter app (Next.js + Supabase) using core + blocks
- [ ] SifaloPay provider
- [ ] Whop listings: Starter $29, Pro $79, Agency $199; private repo access
- [ ] Product page on aoubak.com
- [ ] Offer done-for-you setups

## Phase 4 — Grow (month 3+)

- [ ] eDahab / Premier Bank providers (by demand)
- [ ] Node backend examples (Express, Hono)
- [ ] SomPay Cloud discovery: interview merchants before building

## Launch checklist (v1.0)

- [ ] All **VERIFY** items in PAYMENTS.md confirmed
- [ ] Real end-to-end payment on each supported wallet
- [ ] Security checklist in ARCHITECTURE.md complete
- [ ] License, refund policy and changelog published
