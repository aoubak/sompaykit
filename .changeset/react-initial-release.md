---
'@sompaykit/react': minor
---

First release: `usePayment()` (double-tap safe, idempotent resend after connection problems) and `usePaymentStatus()` (polls until paid, failed or expired, with backoff). Both call your own API routes; no gateway keys in the browser.
