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

## Automatic mode (WaafiPay)

Coming soon. Credentials are read on the server only; never expose them to the browser.

## License

MIT © Aoub
