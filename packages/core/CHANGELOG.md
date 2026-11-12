# @sompaykit/core

## 0.1.0

### Minor Changes

- 890b806: First release: `createSomPay()`, manual provider, Somali phone normalization, wallet detection, USSD dial links and so/en/ar error messages. WaafiPay provider is a placeholder until sandbox testing.
- a3c3ae3: Add the payment page method with SifaloPay hosted checkout: `createSomPay({ provider: 'sifalopay', apiUser, apiKey, env })`, `sompay.checkout()` returns the URL to send the buyer to, and `sompay.verify()` confirms the payment (paid only on status `success` + code `601`, with sid, currency and amount checks). New types `CheckoutInput`, `CheckoutResult`, `VerifyInput`, `VerifyResult` and `HostedCheckoutProvider`; new error codes `METHOD_NOT_SUPPORTED` and `AMOUNT_MISMATCH`.
- 890b806: Add `isPaymentStatus()`, `isFinalStatus()`, `PAYMENT_STATUSES` and `toClientResult()` (drops the raw gateway response before a result is sent to the browser).
