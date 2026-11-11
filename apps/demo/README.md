# SomPayKit demo shop

Shop → cart → checkout → manual pay → paid, in Somali, English and Arabic. Built with the free
registry components and `@sompaykit/react`. **No real money:** manual mode only, and payments
confirm themselves a few seconds after the customer sends a transaction ID.

```bash
pnpm --filter @sompaykit/demo dev     # API stand-in on :8788 + Next.js on http://localhost:3001
pnpm --filter @sompaykit/demo test    # API tests
pnpm turbo run build --filter=@sompaykit/demo   # static pages → apps/demo/out
```

## How it works

- Pages are a static Next.js export (`out/`).
- `/api/*` is a Cloudflare Pages Function (`functions/api/[[path]].ts`) that calls
  `server/api.ts`: plain `Request → Response`, so it also runs in Node (`scripts/dev-api.ts`)
  or any Worker runtime.
- The browser sends product IDs and quantities only. The server computes the total from
  `server/catalog.ts` and creates the order; the charge uses that total.
- Orders and payments are kept in Cloudflare KV when bound as `DEMO_KV`, otherwise in memory.

## Settings (environment variables)

| Variable                                                                         | Default      |                                                                         |
| -------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| `DEMO_EVC_NUMBER`, `DEMO_ZAAD_NUMBER`, `DEMO_SAHAL_NUMBER`, `DEMO_EDAHAB_NUMBER` | placeholders | Your own wallet numbers. If any is set, only those wallets are offered. |
| `DEMO_ALLOW_DIAL`                                                                | off          | `1` shows "Dial to pay". Only works with your own numbers.              |
| `DEMO_CONFIRM_AFTER_MS`                                                          | `6000`       | Delay before the pretend merchant confirms.                             |

"Dial to pay" stays off with placeholder numbers: it would send real money to whoever owns them.

## Cloudflare Pages

| Setting          | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Root directory   | `apps/demo` (so Pages finds `functions/`)                   |
| Build command    | `cd ../.. && pnpm turbo run build --filter=@sompaykit/demo` |
| Output directory | `out`                                                       |
| Env              | `NODE_VERSION=22`, settings above                           |
| KV binding       | `DEMO_KV` (optional, recommended)                           |

TODO(VERIFY): first real deploy on Cloudflare Pages.
