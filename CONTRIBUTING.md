# Contributing to SomPayKit

Thank you for helping Somali businesses get paid online. Contributions in English or Somali are
welcome.

## Easy ways to help

- **Confirm wallet details.** Phone prefixes and USSD "send money" codes for EVC Plus, Zaad, Sahal
  and eDahab are marked `TODO(VERIFY)` in `packages/core/src/constants.ts`. If you know one for
  sure, open a "Wallet detail" issue with how you checked it.
- **Improve translations.** Somali and Arabic strings live in
  `registry/src/lib/sompaykit-i18n.ts` (components) and `packages/core/src/errors.ts` (errors).
- **Report bugs** with steps to reproduce, the browser and phone you used.
- **Docs.** Pages are in `apps/docs/content/docs/*.mdx`.

## Set up

Node.js 22 and pnpm 10.

```bash
pnpm install
pnpm dev        # docs on :3000, demo shop on :3001 (+ demo API on :8788)
```

## Before you open a pull request

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm changeset   # only if you changed @sompaykit/core or @sompaykit/react
```

## Rules

Read [AGENTS.md](AGENTS.md). The short version:

1. `packages/core` has no runtime dependencies and uses only `fetch`.
2. Never expose gateway credentials to the browser, never trust totals sent by the browser.
3. Every charge has a unique `referenceId`; repeats must not charge twice.
4. Never log credentials or full phone numbers.
5. User-facing text goes in the so/en/ar locale files, never inline.
6. Use logical CSS (`ms-`, `pe-`, `start-`) so Arabic right-to-left works.

## Adding a payment provider

See "Adding a provider" in [AGENTS.md](AGENTS.md). Tests must mock `fetch`; never call real
production gateways from tests.

By contributing you agree your work is released under the [MIT License](LICENSE).
