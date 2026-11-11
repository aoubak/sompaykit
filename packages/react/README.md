# @sompaykit/react

React hooks to start a Somali mobile-money payment (EVC Plus, Zaad, Sahal, eDahab) and follow it
until it's paid. They call **your own API routes**; gateway keys stay on your server with
[`@sompaykit/core`](../core).

```bash
pnpm add @sompaykit/react @sompaykit/core
```

## In the browser

```tsx
import { message } from '@sompaykit/core';
import { usePayment, usePaymentStatus } from '@sompaykit/react';

function Checkout({ orderId }: { orderId: string }) {
  const payment = usePayment({ charge: '/api/pay' });
  const status = usePaymentStatus(payment.referenceId, {
    check: '/api/pay/status',
    enabled: payment.result !== null,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        void payment.pay({ phone: String(data.get('phone')), orderId });
      }}
    >
      <input name="phone" inputMode="numeric" />
      <button disabled={payment.isSubmitting}>Pay</button>
      {payment.errorCode && <p role="alert">{message(payment.errorCode, 'so')}</p>}
      <p aria-live="polite">{status.status}</p>
    </form>
  );
}
```

- **No amount is sent.** Your server looks up the order and calculates the total.
- **Double taps are safe.** A second `pay()` while one is running returns the same promise.
- **Resends are idempotent.** After a connection problem, paying again with the same details reuses
  the same `referenceId`, so the server returns the existing payment instead of charging twice.
- Phone numbers are checked in the browser first (`INVALID_NUMBER` never reaches your server).
- `usePaymentStatus` polls every 3 s until `paid`, `failed` or `expired`, and waits longer
  (up to 30 s) while requests fail. `requestError` tells you the connection dropped.

## On your server

Any framework. The default transport expects:

| Hook               | Request                                                                         | Success response         |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------ |
| `usePayment`       | `POST /api/pay` JSON `{ referenceId, phone, wallet?, orderId?, customerName? }` | `toClientResult(result)` |
| `usePaymentStatus` | `GET /api/pay/status?referenceId=…`                                             | `{ status, errorCode? }` |

Errors: any non-2xx status with JSON `{ errorCode }`.

```ts
import { createSomPay, isSomPayError, toClientResult } from '@sompaykit/core';

const sompay = createSomPay({
  provider: 'manual',
  merchantNumbers: { evc: process.env.EVC_NUMBER! },
});

export async function POST(request: Request) {
  const body = await request.json();
  const order = await db.orders.find(body.orderId); // total comes from YOUR database
  try {
    const result = await sompay.charge({
      referenceId: body.referenceId,
      orderId: order.id,
      phone: body.phone,
      wallet: body.wallet,
      amount: order.total,
      currency: 'USD',
    });
    return Response.json(toClientResult(result)); // never send `raw` to the browser
  } catch (error) {
    if (isSomPayError(error)) return Response.json({ errorCode: error.code }, { status: 400 });
    throw error;
  }
}
```

Need custom auth or a different API shape? Pass functions instead of URLs:
`usePayment({ charge: (body, signal) => myApi.pay(body, { signal }) })`.

## License

MIT
