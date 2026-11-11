# SomPayKit registry (free items)

shadcn/ui registry for SomPayKit's free components. MIT.

```bash
npx shadcn@latest add https://sompaykit.dev/r/checkout-form.json
npx shadcn@latest add https://sompaykit.dev/r/manual-pay-card.json
npx shadcn@latest add https://sompaykit.dev/r/payment-status.json
npx shadcn@latest add https://sompaykit.dev/r/wallet-picker.json
```

Each component also installs `sompaykit-base`: the theme tokens (merged into your global CSS),
so/en/ar strings in `lib/sompaykit-i18n.ts`, formatters and inline icons.

| Item              | Mockup          | What it does                                                                                    |
| ----------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `checkout-form`   | 3 · Checkout    | Name, `+252` phone with wallet detection, wallet picker, total, Pay. Calls `usePayment()`.      |
| `wallet-picker`   | 3 · Checkout    | EVC Plus / Zaad / Sahal / eDahab radio cards.                                                   |
| `manual-pay-card` | 4a · Manual pay | Exact amount, merchant number + Copy, USSD "Dial to pay", transaction ID, screenshot.           |
| `payment-status`  | 4b, 5a, 6, 7    | Waiting for PIN, awaiting confirmation, paid, failed, expired. `PaymentStatusBadge` for tables. |

## Develop

```bash
pnpm --filter @sompaykit/registry test        # components, strings, registry build checks
pnpm --filter @sompaykit/registry build       # → dist/r/*.json
REGISTRY_URL=http://localhost:3000 pnpm --filter @sompaykit/registry build   # local install test
```

- `src/styles/sompaykit.css` is the single source of truth for tokens (see `docs/DESIGN-SYSTEM.md`).
- `src/components/ui/*` and `src/lib/utils.ts` are stand-ins for shadcn's own files. Not published.
- Never import from `pro/` here.
