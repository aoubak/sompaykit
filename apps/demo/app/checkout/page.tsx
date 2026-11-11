'use client';

// Checkout → manual pay → status, on one page. The server creates the order and computes the
// total from its own catalog; the browser only sends product IDs and quantities.
import {
  type ClientPaymentResult,
  type ErrorCode,
  type ManualInstructions,
  type PaymentStatus,
} from '@sompaykit/core';
import { toErrorCode, usePaymentStatus } from '@sompaykit/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckoutForm } from '@/components/sompaykit/checkout-form';
import { ManualPayCard, type PaymentProof } from '@/components/sompaykit/manual-pay-card';
import { PaymentStatusCard } from '@/components/sompaykit/payment-status';
import { LoaderIcon } from '@/components/sompaykit/icons';
import { ShopHeader } from '~/components/shop-header';
import { useShop } from '~/lib/shop';
import { createOrder, sendProof, type CreatedOrder } from '~/lib/api';

type Step =
  | { name: 'form' }
  | { name: 'manual'; referenceId: string; instructions: ManualInstructions }
  | { name: 'status'; referenceId: string; initialStatus: PaymentStatus };

export default function CheckoutPage() {
  const shop = useShop();
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [orderError, setOrderError] = useState(false);
  const [orderAttempt, setOrderAttempt] = useState(0);
  const [step, setStep] = useState<Step>({ name: 'form' });
  const [formKey, setFormKey] = useState(0);
  const [proofSending, setProofSending] = useState(false);
  const [proofError, setProofError] = useState<ErrorCode | null>(null);
  const paidOrder = useRef<string | null>(null);

  const cartKey = JSON.stringify(shop.lines);
  const hasCart = shop.lines.length > 0;

  // One server order per cart. Skipped once paid (the cart is cleared then).
  useEffect(() => {
    if (!shop.ready || !hasCart || paidOrder.current !== null) return;
    const controller = new AbortController();
    setOrderError(false);
    createOrder(JSON.parse(cartKey) as typeof shop.lines, controller.signal)
      .then(setOrder)
      .catch(() => {
        if (!controller.signal.aborted) setOrderError(true);
      });
    return () => controller.abort();
    // cartKey stands for shop.lines (a new array on every change).
  }, [shop.ready, hasCart, cartKey, orderAttempt]);

  const referenceId = step.name === 'form' ? null : step.referenceId;
  const status = usePaymentStatus(referenceId, {
    check: '/api/pay/status',
    enabled: step.name === 'status',
    ...(step.name === 'status' && { initialStatus: step.initialStatus }),
  });

  useEffect(() => {
    if (status.status === 'paid' && order && paidOrder.current === null) {
      paidOrder.current = order.orderId;
      shop.clear();
    }
  }, [status.status, order, shop]);

  function onResult(result: ClientPaymentResult) {
    if (result.instructions && result.status === 'awaiting_proof') {
      setStep({
        name: 'manual',
        referenceId: result.referenceId,
        instructions: result.instructions,
      });
    } else {
      setStep({ name: 'status', referenceId: result.referenceId, initialStatus: result.status });
    }
  }

  async function onSubmitProof(proof: PaymentProof) {
    if (step.name !== 'manual') return;
    setProofSending(true);
    setProofError(null);
    try {
      const next = await sendProof(step.referenceId, proof.transactionId);
      setStep({ name: 'status', referenceId: step.referenceId, initialStatus: next });
    } catch (error) {
      setProofError(toErrorCode(error));
    } finally {
      setProofSending(false);
    }
  }

  function startOver() {
    setStep({ name: 'form' });
    setFormKey((n) => n + 1);
  }

  const title =
    step.name === 'form'
      ? shop.t.checkoutTitle
      : step.name === 'manual'
        ? shop.t.payTitle
        : shop.t.statusTitle;
  const paid = paidOrder.current !== null;

  let body;
  if (step.name === 'status') {
    body = (
      <PaymentStatusCard
        status={status.status}
        errorCode={status.errorCode}
        requestError={status.requestError}
        {...(order && { amount: order.total, currency: order.currency })}
        locale={shop.locale}
        onRetry={startOver}
        onChangeWallet={startOver}
      >
        {status.status === 'paid' && (
          <Link
            href="/"
            className="inline-flex h-13 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {shop.t.newOrder}
          </Link>
        )}
      </PaymentStatusCard>
    );
  } else if (step.name === 'manual') {
    body = (
      <ManualPayCard
        instructions={step.instructions}
        storeName={shop.t.storeName}
        locale={shop.locale}
        isSubmitting={proofSending}
        errorCode={proofError}
        allowScreenshot={false}
        onSubmitProof={onSubmitProof}
      />
    );
  } else if (shop.ready && !hasCart && !paid) {
    body = (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{shop.t.cartEmpty}</p>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-xl border bg-card px-5 font-semibold"
        >
          {shop.t.backToShop}
        </Link>
      </div>
    );
  } else if (orderError) {
    body = (
      <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{shop.t.orderFailed}</p>
        <Button
          type="button"
          onClick={() => setOrderAttempt((n) => n + 1)}
          className="h-12 rounded-xl px-5 font-semibold"
        >
          {shop.t.retry}
        </Button>
      </div>
    );
  } else if (!order) {
    body = (
      <div role="status" className="flex flex-col items-center gap-3 py-16 text-center">
        <LoaderIcon className="size-8 animate-spin text-primary motion-reduce:animate-none" />
        <p className="text-muted-foreground">{shop.t.preparing}</p>
      </div>
    );
  } else {
    body = (
      <CheckoutForm
        key={formKey}
        charge="/api/pay"
        orderId={order.orderId}
        amount={order.total}
        currency={order.currency}
        itemCount={shop.count}
        locale={shop.locale}
        onResult={onResult}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ShopHeader back={step.name === 'form' ? '/cart' : '/'} title={title} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">{body}</main>
    </div>
  );
}
