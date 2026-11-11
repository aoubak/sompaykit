# Design System

SomPayKit design system, built on Aoub's free Design System Starter Kit. Approved in the SomPayKit UI Mockups canvas. Brand: **purple + green**, **sans-serif only**.

## 1. Principles

1. **Mobile-first.** Most Somali shoppers buy on Android phones, often on slow data.
2. **Trust at checkout.** Clear amounts, wallet logos, explicit status at every step.
3. **Simple over clever.** One primary action per screen.
4. **Accessible.** WCAG AA contrast, 44px touch targets, visible focus.
5. **Bidirectional.** Every layout works in LTR (so/en) and RTL (ar).

## 2. Color tokens

**Final.** Light values are the approved mockup colors (`docs/mockups/README.md`). Source of truth:
[`registry/src/styles/sompaykit.css`](../registry/src/styles/sompaykit.css), CSS variables in the
shadcn/ui + Tailwind v4 convention (`bg-primary`, `text-success-muted-foreground`, …). The
`sompaykit-theme` registry item ships the same values, and a test keeps the two in sync.

| Token | Light | Use |
|---|---|---|
| `--primary` / `-foreground` | `#5B2FD1` / `#FFFFFF` | Pay, Add to cart, links, focus ring |
| `--primary-hover` | `#4421A8` | Hover/pressed primary |
| `--primary-muted` / `-foreground` | `#EDE7FC` / `#3B1E8F` | Detected-wallet chip, selected-card glow |
| `--success` / `-foreground` | `#157A52` / `#FFFFFF` | Paid only |
| `--success-muted` / `-foreground` | `#DCF5E9` / `#0F5132` | "Paid" badge |
| `--warning` / `-muted` / `-muted-foreground` | `#B45309` / `#FEF3C7` / `#78350F` | Awaiting confirmation |
| `--destructive` / `-muted` / `-muted-foreground` | `#B91C1C` / `#FEE2E2` / `#7F1D1D` | Failed, reject |
| `--info` / `-muted` / `-muted-foreground` | `#1D4ED8` / `#DBEAFE` / `#1E3A8A` | Waiting for PIN |
| `--background` | `#F6F5FA` | Page surface |
| `--card`, `--popover` | `#FFFFFF` | Cards, sheets |
| `--foreground` | `#18181B` | Ink |
| `--muted` / `--muted-foreground` | `#F4F4F5` / `#52525B` | Number box, expired badge / helper text |
| `--secondary`, `--accent` | `#F4F4F5` | shadcn neutral fills and hover backgrounds |
| `--border` / `--input` | `#E4E4E7` / `#D4D4D8` | Dividers / input and secondary-button borders |
| `--radius` | `0.75rem` (12px) | |

Dark mode (`.dark`) values are **proposed, not in the mockups**. All text pairs pass WCAG AA in both themes.

**Usage rules**
- Purple = primary actions (Pay, Add to cart).
- Green (`success`) = paid states only, never decorative. `accent` is **not** green: in shadcn it is
  the neutral hover background for menus and ghost buttons.
- Status colors always paired with an icon + text (never color alone).
- TODO(REVIEW): the approved input border `#D4D4D8` is 1.5:1 on white, below the 3:1 UI target in §8.
  Inputs stay usable (label + 2px primary focus border), but consider darkening before v1.0.

## 3. Typography

Sans-serif only.

| Use | Font |
|---|---|
| UI + body (Latin) | Geist (fallback: DM Sans) |
| Arabic | IBM Plex Sans Arabic or Noto Sans Arabic |

| Token | Size / line-height | Use |
|---|---|---|
| `text-display` | 32/40 | Hero |
| `text-h1` | 24/32 | Page titles |
| `text-h2` | 20/28 | Section titles |
| `text-body` | 16/24 | Default (never smaller on mobile inputs) |
| `text-sm` | 14/20 | Helper text |
| `text-xs` | 12/16 | Badges, legal |

Prices use `tabular-nums`.

## 4. Spacing & layout

- 4px base scale (Tailwind default).
- Mobile gutter 16px; max content width 1200px.
- Checkout is a single column on all sizes.
- Sticky bottom "Pay" bar on mobile.

## 5. Core components

| Component | Notes |
|---|---|
| `ProductCard` | Image, name, price, add button; skeleton state |
| `CartSheet` | Bottom sheet on mobile, side sheet on desktop |
| `PhoneInput` | `+252` prefix, numeric keypad, auto-detects wallet |
| `WalletPicker` | Radio cards with wallet logo + name; auto-selected from prefix |
| `ManualPayCard` | Merchant number, copy button, USSD "Dial" button, amount |
| `ProofUpload` | Transaction ID field + optional screenshot |
| `PaymentStatus` | States: waiting for PIN, awaiting confirmation, paid, failed, expired |
| `OrderTable` | Dashboard list with status badges + confirm/reject actions |
| `LocaleSwitcher` | so / en / ar; flips `dir` |
| `WhatsAppButton` | Pre-filled order message |

## 6. Payment status patterns

| State | Color | Icon | Copy (so) |
|---|---|---|---|
| Waiting for PIN | info | phone | Geli PIN-kaaga taleefankaaga |
| Awaiting confirmation | warning | clock | Waxaan sugaynaa xaqiijinta ganacsadaha |
| Paid | success | check | Lacagta waa la helay |
| Failed | destructive | x | Lacag bixinta way fashilantay |
| Expired | muted | timer-off | Waqtigii wuu dhamaaday |

## 7. RTL rules

- Use logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*` — never `ml/mr/left/right`.
- Set `<html dir>` from locale.
- Mirror directional icons (arrows, chevrons) with `rtl:rotate-180`.
- Numbers and phone numbers stay LTR inside RTL text (`dir="ltr"` on the span).

## 8. Accessibility

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI elements.
- Touch targets ≥ 44×44px.
- All payment status changes announced via `aria-live="polite"`.
- Respect `prefers-reduced-motion`.
- Form errors linked with `aria-describedby`.

## 9. Performance budget

- LCP < 2.5s on a mid-range Android over 3G.
- Initial JS < 150KB gzip on shop pages.
- Images via `next/image`, WebP/AVIF, lazy below the fold.
