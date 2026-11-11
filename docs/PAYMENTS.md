# Payments

Two modes, one interface. Merchant switches mode in **Dashboard → Settings**.

> ⚠️ Everything marked **VERIFY** must be confirmed against current provider docs and live testing before release.

## 1. Provider interface

```ts
// packages/core/src/types.ts
export type Wallet = "evc" | "zaad" | "sahal" | "edahab" | "card";

export type PaymentStatus =
  | "pending"                // automatic: waiting for the customer's PIN
  | "awaiting_proof"         // manual: waiting for the customer to pay + send a transaction ID
  | "awaiting_confirmation"  // manual: proof sent, waiting for the merchant
  | "paid" | "failed" | "expired";

export interface CreatePaymentInput {
  orderId: string;
  referenceId: string;   // unique, used for idempotency
  amount: number;        // server-calculated
  currency: "USD" | "SLSH";
  payerPhone: string;    // normalized, e.g. 2526xxxxxxx
  wallet: Wallet;
  description: string;
}

export interface CreatePaymentResult {
  referenceId: string;
  status: PaymentStatus;
  providerTxnId?: string;
  instructions?: ManualInstructions; // manual mode only
  errorCode?: string;                // mapped to localized message
  raw?: unknown;
}

export interface PaymentProvider {
  id: "manual" | "waafipay" | "sifalopay";
  // Manual returns status "awaiting_proof" with instructions.
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  checkStatus(referenceId: string): Promise<PaymentStatus>;
}
```

## 2. Manual mode (Starter — $0 API fee)

```
Checkout → order "pending"
   ↓
Show merchant number for chosen wallet + USSD deep link (pre-filled amount)
   ↓
Customer pays on their phone
   ↓
Customer submits transaction ID and/or screenshot → "awaiting_confirmation"
   ↓
Merchant gets WhatsApp/dashboard alert → taps Confirm / Reject
   ↓
"paid" → customer sees confirmation + WhatsApp receipt
```

- USSD link: `tel:` URI with encoded `#` (`%23`). EVC Plus pattern `*712*{number}*{amount}#` — **VERIFY** per wallet.
- Auto-expire unconfirmed orders after a configurable window (default 24h).
- Flag duplicate transaction IDs.

## 3. Automated mode (Pro)

```
Checkout → order "pending" → server action
   ↓
provider.createPayment()  (server-side, keys from env)
   ↓
Customer's phone shows PIN prompt
   ↓
Gateway returns approved / declined / timeout
   ↓
Update payment + order → confirmation + receipt
```

### WaafiPay adapter notes (VERIFY against docs.waafipay.com)

- Purchase request uses `serviceName: "API_PURCHASE"` with `merchantUid`, `apiUserId`, `apiKey`, `paymentMethod: "mwallet_account"`, `payerInfo.accountNo`, `transactionInfo { referenceId, invoiceId, amount, currency, description }`.
- Supports EVC Plus, Zaad, Sahal, Waafi; cards via hosted page.
- Sandbox credentials required for development.

### SifaloPay adapter

- Second automated option; covers EVC Plus, Zaad, eDahab, Premier wallet (per community reports — **VERIFY**).

## 4. Wallet detection

```ts
// packages/core/src/wallets.ts — prefixes are VERIFY before release
const PREFIXES: Record<string, Wallet> = {
  "61": "evc", "77": "evc",
  "63": "zaad",
  "90": "sahal",
  "62": "edahab", "65": "edahab",
};
```

- Normalize input: strip spaces, `+`, leading `0`, add `252`.
- If prefix unknown → let the customer pick manually.

## 5. Edge cases (the real value of the kit)

| Case | Handling |
|---|---|
| Customer never enters PIN | Timeout → `expired`, "Try again" button reuses order |
| Double tap on Pay | Unique `referenceId`; second call returns existing payment |
| Gateway down | Graceful fallback to manual mode (if merchant enabled it) |
| Amount tampered on client | Server recalculates from DB |
| Insufficient balance | Mapped localized error |

## 6. Error messages (examples)

| Code | Somali | English |
|---|---|---|
| `INSUFFICIENT_FUNDS` | Lacagtaada kuma filna. | Insufficient balance. |
| `TIMEOUT` | Waqtigii wuu dhamaaday. Fadlan isku day mar kale. | Payment timed out. Please try again. |
| `CANCELLED` | Lacag bixinta waa la joojiyay. | Payment was cancelled. |
| `INVALID_NUMBER` | Lambarka taleefanka sax maaha. | Invalid phone number. |

All strings live in `packages/core/src/errors.ts` (so/en/ar).

## 7. Compliance

- Each merchant uses **their own** gateway account. The kit never pools funds.
- Onboarding guide in the kit explains WaafiPay/SifaloPay merchant requirements and fees (**VERIFY current terms**).
