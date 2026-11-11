import type { ManualInstructions } from '@sompaykit/core';
import type { ChargeFn } from '@sompaykit/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '@/components/sompaykit/checkout-form';
import { ManualPayCard } from '@/components/sompaykit/manual-pay-card';
import { PaymentStatusBadge, PaymentStatusCard } from '@/components/sompaykit/payment-status';
import { WalletPicker } from '@/components/sompaykit/wallet-picker';

afterEach(cleanup);

describe('WalletPicker', () => {
  it('shows wallets as radios and reports the pick', () => {
    const onChange = vi.fn();
    render(<WalletPicker value="evc" onChange={onChange} locale="en" />);
    expect(screen.getByRole('group', { name: 'Pay with' })).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
    expect((screen.getByRole('radio', { name: /EVC Plus/ }) as HTMLInputElement).checked).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('radio', { name: /Zaad/ }));
    expect(onChange).toHaveBeenCalledWith('zaad');
  });

  it('offers only the wallets it is given', () => {
    render(<WalletPicker value={null} onChange={vi.fn()} wallets={['zaad']} />);
    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });
});

describe('CheckoutForm', () => {
  const okCharge = () =>
    vi.fn<ChargeFn>(async (body) => ({ referenceId: body.referenceId, status: 'awaiting_proof' }));

  function setup(props: Partial<Parameters<typeof CheckoutForm>[0]> = {}) {
    const charge = okCharge();
    const onResult = vi.fn();
    render(
      <CheckoutForm
        charge={charge}
        amount={18}
        currency="USD"
        orderId="order_1"
        itemCount={2}
        locale="en"
        onResult={onResult}
        {...props}
      />,
    );
    const type = (label: string, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    return { charge, onResult, type };
  }

  it('detects the wallet from the number and starts the payment', async () => {
    const { charge, onResult, type } = setup();
    type('Full name', 'Hodan Ali');
    type('Mobile money number', '61 234 5678');

    expect(screen.getByText(/from your number/).textContent).toContain('EVC Plus');
    expect((screen.getByRole('radio', { name: /EVC Plus/ }) as HTMLInputElement).checked).toBe(
      true,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(charge.mock.calls[0]?.[0]).toMatchObject({
      phone: '252612345678',
      wallet: 'evc',
      orderId: 'order_1',
      customerName: 'Hodan Ali',
    });
    expect(charge.mock.calls[0]?.[0]).not.toHaveProperty('amount');
  });

  it("keeps the customer's own wallet pick", async () => {
    const { charge, type } = setup({ askName: false });
    fireEvent.click(screen.getByRole('radio', { name: /Zaad/ }));
    type('Mobile money number', '612345678');
    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    await waitFor(() => expect(charge).toHaveBeenCalled());
    expect(charge.mock.calls[0]?.[0].wallet).toBe('zaad');
  });

  it('asks for a name and a valid number before calling the server', async () => {
    const { charge, type } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(screen.getByText('Please enter your name.')).toBeTruthy();
    expect(screen.getByText('Please choose a wallet.')).toBeTruthy();

    type('Full name', 'Hodan');
    fireEvent.click(screen.getByRole('radio', { name: /Sahal/ }));
    type('Mobile money number', '12');
    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    await screen.findByText('Invalid phone number.');
    expect(charge).not.toHaveBeenCalled();
  });

  it('labels the button with amount and wallet in automatic mode', () => {
    const { type } = setup({ mode: 'auto' });
    type('Mobile money number', '631234567');
    expect(screen.getByRole('button', { name: 'Pay $18.00 with Zaad' })).toBeTruthy();
  });

  it('shows server errors in the chosen language and lays out Arabic right-to-left', async () => {
    const charge = vi.fn<ChargeFn>(async () => {
      throw Object.assign(new Error('down'), { code: 'PROVIDER_ERROR' });
    });
    const { container } = render(
      <CheckoutForm charge={charge} amount={18} currency="USD" locale="ar" askName={false} />,
    );
    expect(container.querySelector('form')?.getAttribute('dir')).toBe('rtl');
    fireEvent.change(screen.getByLabelText('رقم المحفظة'), { target: { value: '612345678' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect((await screen.findByRole('alert')).textContent).toBe(
      'واجهت خدمة الدفع مشكلة. يرجى المحاولة مرة أخرى.',
    );
  });
});

describe('ManualPayCard', () => {
  const instructions: ManualInstructions = {
    wallet: 'evc',
    number: '619998888',
    amount: 18,
    currency: 'USD',
    ussdCode: '*712*619998888*18#',
    ussdLink: 'tel:*712*619998888*18%23',
  };

  it('shows the amount, number and dial link', () => {
    render(
      <ManualPayCard
        instructions={instructions}
        storeName="Hodan Shop"
        locale="en"
        onSubmitProof={vi.fn()}
      />,
    );
    expect(screen.getByText('$18.00')).toBeTruthy();
    expect(screen.getByText('61 999 8888')).toBeTruthy();
    expect(screen.getByText('Hodan Shop')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Dial to pay now' }).getAttribute('href')).toBe(
      'tel:*712*619998888*18%23',
    );
  });

  it('copies the plain number', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ManualPayCard instructions={instructions} locale="en" onSubmitProof={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await screen.findByText('Copied');
    expect(writeText).toHaveBeenCalledWith('619998888');
  });

  it('needs a transaction ID, then sends the proof', async () => {
    const onSubmitProof = vi.fn();
    render(<ManualPayCard instructions={instructions} locale="en" onSubmitProof={onSubmitProof} />);
    fireEvent.click(screen.getByRole('button', { name: "I've sent the payment" }));
    expect(screen.getByText('Please enter the transaction ID from your SMS.')).toBeTruthy();
    expect(onSubmitProof).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Transaction ID from your SMS'), {
      target: { value: ' 12345678 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: "I've sent the payment" }));
    await waitFor(() =>
      expect(onSubmitProof).toHaveBeenCalledWith({ transactionId: '12345678', screenshot: null }),
    );
  });

  it('falls back to menu instructions when the wallet has no USSD code', () => {
    render(
      <ManualPayCard
        instructions={{ ...instructions, wallet: 'zaad', ussdCode: null, ussdLink: null }}
        locale="en"
        onSubmitProof={vi.fn()}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Dial to pay now' })).toBeNull();
    expect(screen.getByText('Send the money from your Zaad menu.')).toBeTruthy();
  });
});

describe('PaymentStatusCard', () => {
  it('announces each status with badge and title', () => {
    const cases = [
      ['pending', 'Waiting for PIN', 'Check your phone'],
      ['awaiting_confirmation', 'Awaiting confirmation', "We're checking your payment"],
      ['paid', 'Paid', 'Payment received'],
      ['expired', 'Expired', 'Time ran out'],
    ] as const;
    for (const [status, badge, title] of cases) {
      render(<PaymentStatusCard status={status} locale="en" />);
      const live = screen.getByRole('status');
      expect(live.getAttribute('aria-live')).toBe('polite');
      expect(live.textContent).toContain(badge);
      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
      cleanup();
    }
  });

  it('fills the PIN message and counts down', () => {
    render(
      <PaymentStatusCard
        status="pending"
        amount={18}
        currency="USD"
        wallet="evc"
        phone="252612345678"
        expiresAt={Date.now() + 102_000}
        locale="en"
      />,
    );
    expect(screen.getByRole('status').textContent).toContain(
      'A payment request for $18.00 was sent to +252 61 234 5678. Enter your EVC Plus PIN to approve it.',
    );
    expect(screen.getByText('01:42')).toBeTruthy();
  });

  it('explains a failure in the chosen language and offers next steps', () => {
    const onRetry = vi.fn();
    const onChangeWallet = vi.fn();
    render(
      <PaymentStatusCard
        status="failed"
        errorCode="INSUFFICIENT_FUNDS"
        locale="so"
        onRetry={onRetry}
        onChangeWallet={onChangeWallet}
      />,
    );
    expect(screen.getByText('Lacagtaada kuma filna.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Isku day mar kale' }));
    fireEvent.click(screen.getByRole('button', { name: 'Isticmaal hab kale' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onChangeWallet).toHaveBeenCalledOnce();
  });

  it('shows a loader before the first status and a notice on weak signal', () => {
    render(<PaymentStatusCard status={null} locale="en" />);
    expect(screen.getByRole('status').textContent).toBe('Checking your payment…');
    cleanup();
    render(<PaymentStatusCard status="pending" requestError="NETWORK_ERROR" locale="en" />);
    expect(screen.getByText('Weak connection. We keep checking.')).toBeTruthy();
  });

  it('renders a badge for tables', () => {
    render(<PaymentStatusBadge status="paid" locale="ar" />);
    expect(screen.getByText('مدفوع')).toBeTruthy();
  });
});
