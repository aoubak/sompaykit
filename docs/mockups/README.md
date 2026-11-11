# UI mockups (approved)

Approved design screens for the free components and the demo shop (copy from 2026-11-09). Pro
screens (merchant dashboard, settings, Arabic checkout) are in the private Pro repo.

Each `.dc.html` file is a design-canvas artboard (inline styles, not production code). Use them as the visual reference; build the real components with shadcn/ui and CSS variables.

| File | Screen | Used in |
|---|---|---|
| `Main.dc.html` | UI style: colors, type, buttons, phone input, status badges | Phase 2 tokens |
| `Shop.dc.html` | 1 · Shop (product grid, sticky cart bar) | Demo shop |
| `Cart.dc.html` | 2 · Cart | Demo shop |
| `Checkout.dc.html` | 3 · Checkout: name, phone + detected wallet, wallet picker, total | Phase 2 `checkout-form`, `wallet-picker` |
| `ManualPay.dc.html` | 4a · Manual pay: amount, merchant number, Copy, "Dial to pay", transaction ID + screenshot | Phase 2 `manual-pay-card` |
| `WaitingPin.dc.html` | 4b · Enter PIN (automatic, Pro) | Phase 2 `payment-status` |
| `Awaiting.dc.html` | 5a · Awaiting merchant confirmation | Phase 2 `payment-status` |
| `Success.dc.html` | 6 · Paid | Phase 2 `payment-status` |
| `Failed.dc.html` | 7 · Failed / expired | Phase 2 `payment-status` |

Flow: Checkout → 4a Manual → 5a Awaiting → 6 Paid, or Checkout → 4b PIN → 6 Paid / 7 Failed.

## Colors used in the mockups

These hex values are the **final light-theme tokens** (Phase 2). They live in `registry/src/styles/sompaykit.css`; see `DESIGN-SYSTEM.md` §2.

| Role | Hex |
|---|---|
| Primary (purple) | `#5B2FD1` (hover `#4421A8`, tint `#EDE7FC`, deep text `#3B1E8F`) |
| Paid green | `#157A52` (badge `#DCF5E9` / `#0F5132`) |
| Ink / text | `#18181B` |
| Muted text | `#52525B` |
| Border | `#E4E4E7`, input border `#D4D4D8` |
| Surface (page) | `#F6F5FA`; cards `#FFFFFF` |
| Warning | `#B45309` (badge `#FEF3C7` / `#78350F`) |
| Danger | `#B91C1C` (badge `#FEE2E2` / `#7F1D1D`) |
| Info | `#1D4ED8` (badge `#DBEAFE` / `#1E3A8A`) |

Radius 12px, touch targets ≥ 44px, sticky bottom action bar on mobile.
