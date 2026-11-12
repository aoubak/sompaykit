---
'@sompaykit/core': minor
---

Add the payment page method with SifaloPay hosted checkout: `createSomPay({ provider: 'sifalopay', apiUser, apiKey, env })`, `sompay.checkout()` returns the URL to send the buyer to, and `sompay.verify()` confirms the payment (paid only on status `success` + code `601`, with sid, currency and amount checks). New types `CheckoutInput`, `CheckoutResult`, `VerifyInput`, `VerifyResult` and `HostedCheckoutProvider`; new error codes `METHOD_NOT_SUPPORTED` and `AMOUNT_MISMATCH`.
