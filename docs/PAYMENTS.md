# Payments

Three payment methods. Merchant switches method in **Dashboard → Settings**.

| Method | Provider | How the customer pays | Status |
|---|---|---|---|
| Manual | `manual` | Sends money to the merchant's number, then sends the transaction ID | Works |
| PIN prompt | `waafipay` | Enters a PIN on their phone | Stub, waiting for sandbox keys |
| Payment page | `sifalopay` | Is sent to the provider's page, pays there, comes back | Works on staging |

Manual and PIN prompt share `PaymentProvider` (they need a phone number). The payment page uses
`HostedCheckoutProvider` (no phone number: it returns a URL and is confirmed later).

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

// Payment page (hosted checkout)
export interface CheckoutInput {
  orderId: string;       // added to returnUrl as order_id
  amount: number;        // server-calculated
  currency: "USD" | "SLSH";
  returnUrl: string;     // the buyer lands here after paying, with sid added
  webhookUrl: string;    // the gateway calls this; the body is not signed
}

export interface CheckoutResult {
  redirectUrl: string;   // send the buyer here
  raw?: unknown;
}

export interface VerifyInput {
  sid?: string;          // from the return URL or the webhook
  orderId?: string;      // fallback when there is no sid
  amount?: number;       // the order's amount from your database: pass it every time
}

export interface VerifyResult {
  status: "paid" | "pending" | "failed";
  sid: string | null;
  amount: number | null;
  currency: string | null;
  paymentType: string | null;
  errorCode?: string;    // when status is "failed"
  detail?: string;       // the gateway's own text, for logs
  raw?: unknown;
}

export interface HostedCheckoutProvider {
  id: "manual" | "waafipay" | "sifalopay";
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyPayment(input: VerifyInput): Promise<VerifyResult>;
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

## 4. Payment page (SifaloPay hosted checkout)

```
Checkout → order "pending" (server calculates the amount)
   ↓
sompay.checkout()  →  redirectUrl  →  send the buyer there
   ↓
Buyer pays on SifaloPay's page (EVC, ZAAD, Sahal, eDahab, Premier or card)
   ↓
Buyer comes back to returnUrl with order_id and sid   (and SifaloPay calls webhookUrl)
   ↓
sompay.verify({ sid, amount })  (server-side)
   ↓
"paid" → mark the order paid, store the sid → confirmation + receipt
```

```ts
const sompay = createSomPay({ provider: "sifalopay", apiUser, apiKey, env: "staging" });

const { redirectUrl } = await sompay.checkout({
  orderId: order.id,
  amount: order.total,      // from your database
  currency: "USD",
  returnUrl: "https://shop.example/checkout/return",
  webhookUrl: "https://shop.example/api/sifalo-webhook",
});

// On the return URL and in the webhook:
const result = await sompay.verify({ sid, amount: order.total });
if (result.status === "paid") {
  /* mark the order paid and store result.sid */
}
```

### How a payment is trusted

Only `verify` counts. The return URL and the webhook body are **not signed**, so anyone can
call them with made-up values. Use them only to learn which payment to verify.

`verify` returns `paid` only when all of these are true:

- SifaloPay answers status `"success"` **and** code `601`.
- The sid in the answer is the sid you asked about.
- The currency is USD.
- The amount equals the `amount` you passed (compared in cents).

Your app must also do two things, because core has no database:

- **Pass the order's amount** from your database to `verify`. Without it the amount is not
  checked.
- **Use each sid once.** Store the sid on the order with a unique constraint, so one payment
  can't unlock two orders.

| SifaloPay answer | `verify` result |
|---|---|
| `success` + `601` and all checks pass | `paid` |
| `success` + `601`, other amount | `failed` / `AMOUNT_MISMATCH` |
| `success` + `601`, other sid | `failed` / `INVALID_REFERENCE` |
| `success` + `601`, not USD | `failed` / `INVALID_CURRENCY` |
| `603` | `pending` (ask again later) |
| `600` | `failed` / `DECLINED` |
| `604` | `failed` / `INSUFFICIENT_FUNDS` |
| Any other code | `failed` / `PROVIDER_ERROR` |
| No answer, timeout, or not JSON | throws `TIMEOUT` / `NETWORK_ERROR` / `PROVIDER_ERROR` |

When `verify` throws, the state of the payment is unknown. Keep the order pending and try
again; do not mark it failed.

### SifaloPay facts

Tested end to end on staging (pay → return → verify). All values live in the `SIFALOPAY`
constant in `packages/core/src/constants.ts`.

- **Start:** `POST {gateway}` with Basic auth (`apiUser:apiKey`), body
  `{ amount: "3.00", gateway: "checkout", currency: "USD", return_url, webhook_url }`.
  Returns `key` and `token`. The payment page is `{checkout}?key=..&token=..`.
- **Return:** the buyer comes back to `return_url` with `&sid=SID_xxx` added.
- **Verify:** `POST {gateway}verify.php`, no auth, body `{ sid }` (or `{ order_id }`).
- **Currency:** USD only.
- **Timeout:** gateway calls can take long; core allows 120 s.
- **Sandbox:** only test wallets are approved: eDahab `621111111` / `252621111111`. Any other
  number returns `600 "Payment Failed (sandbox)"`.

| | Gateway | Payment page |
|---|---|---|
| Staging | `https://spay-api.sifalo.net/gateway/` | `https://pay.sifalo.net/checkout/` |
| Live (**VERIFY**: no live payment tested yet) | `https://api.sifalopay.com/gateway/` | `https://pay.sifalo.com/checkout/` |

Staging keys only work on staging and live keys only work on live.

## 5. Wallet detection

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

## 6. Edge cases (the real value of the kit)

| Case | Handling |
|---|---|
| Customer never enters PIN | Timeout → `expired`, "Try again" button reuses order |
| Double tap on Pay | Unique `referenceId`; second call returns existing payment |
| Gateway down | Graceful fallback to manual mode (if merchant enabled it) |
| Amount tampered on client | Server recalculates from DB |
| Insufficient balance | Mapped localized error |
| Payment page: buyer never comes back | The webhook still arrives; verify there too |
| Payment page: fake return URL or webhook | Ignored unless `verify` says `paid` |
| Payment page: paid a smaller amount | `verify` → `failed` / `AMOUNT_MISMATCH` |
| Payment page: same sid sent for two orders | Unique constraint on the stored sid |

## 7. Error messages (examples)

| Code | Somali | English |
|---|---|---|
| `INSUFFICIENT_FUNDS` | Lacagtaada kuma filna. | Insufficient balance. |
| `TIMEOUT` | Waqtigii wuu dhamaaday. Fadlan isku day mar kale. | Payment timed out. Please try again. |
| `CANCELLED` | Lacag bixinta waa la joojiyay. | Payment was cancelled. |
| `INVALID_NUMBER` | Lambarka taleefanka sax maaha. | Invalid phone number. |

All strings live in `packages/core/src/errors.ts` (so/en/ar).

## 8. Compliance

- Each merchant uses **their own** gateway account. The kit never pools funds.
- Onboarding guide in the kit explains WaafiPay/SifaloPay merchant requirements and fees (**VERIFY current terms**).
