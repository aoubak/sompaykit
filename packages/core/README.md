# @sompaykit/core

Accept **EVC Plus, Zaad, Sahal and eDahab** in any TypeScript app. Zero dependencies, `fetch` only.
Runs in Node 20+, Bun, Deno, edge and serverless.

```bash
pnpm add @sompaykit/core
```

## Manual mode ($0 API fee)

The customer sends money to your own wallet number and shares the transaction ID; you confirm.

```ts
import { createSomPay, isSomPayError } from '@sompaykit/core';

const sompay = createSomPay({
  provider: 'manual',
  merchantNumbers: { evc: '61XXXXXXX', zaad: '63XXXXXXX' },
});

try {
  const result = await sompay.charge({
    referenceId: order.id, // unique per attempt; repeats return the same payment
    phone: '061 234 5678', // any common format
    amount: order.total, // calculated on your server
    currency: 'USD',
  });
  // result.status === 'awaiting_proof'
  // result.instructions → { number, amount, ussdCode, ussdLink } for a "Dial to pay" button
} catch (error) {
  if (isSomPayError(error)) showError(sompay.message(error.code, 'so'));
  else throw error;
}
```

## Helpers

```ts
sompay.normalizePhone('+252 61 234 5678'); // '252612345678'
sompay.detectWallet('63 123 4567'); // 'zaad' (a suggestion: let the customer change it)
sompay.message('INSUFFICIENT_FUNDS', 'en'); // 'Insufficient balance.'
```

## Payment page (SifaloPay)

The buyer pays on SifaloPay's page (EVC, ZAAD, Sahal, eDahab, Premier or card) and comes back to
your site. USD only. Server-side only: never expose `apiKey` to the browser.

```ts
const sompay = createSomPay({ provider: 'sifalopay', apiUser, apiKey, env: 'staging' });

// 1. Start: send the buyer to redirectUrl
const { redirectUrl } = await sompay.checkout({
  orderId: order.id,
  amount: order.total, // calculated on your server
  currency: 'USD',
  returnUrl: 'https://shop.example/checkout/return',
  webhookUrl: 'https://shop.example/api/sifalo-webhook',
});

// 2. Confirm: on the return URL (it has ?order_id=…&sid=…) and in the webhook
const result = await sompay.verify({ sid, amount: order.total });
if (result.status === 'paid') {
  // mark the order paid and store result.sid
}
```

Only `verify` can be trusted: the return URL and webhook body are not signed. Always pass the
order's `amount`, and store each `sid` with a unique constraint so one payment can't unlock two
orders. If `verify` throws, the state is unknown: keep the order pending and try again.

## Automatic mode (WaafiPay)

Coming soon. Credentials are read on the server only; never expose them to the browser.

## License

MIT © Aoub
