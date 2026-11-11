import Link from 'next/link';
import { ComponentPreview } from '~/components/component-preview';

const WALLETS = ['EVC Plus', 'Zaad', 'Sahal', 'eDahab'];

const PARTS = [
  {
    title: '@sompaykit/core',
    body: 'Phone numbers, wallet detection, USSD codes and payment providers. Zero dependencies, runs anywhere fetch does.',
    href: '/docs/core',
  },
  {
    title: '@sompaykit/react',
    body: 'usePayment and usePaymentStatus: start a payment and follow it, with no double charges on slow data.',
    href: '/docs/react',
  },
  {
    title: 'shadcn/ui components',
    body: 'Checkout form, wallet picker, manual pay card and payment status. Somali, English and Arabic.',
    href: '/docs/components/checkout-form',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-16 md:py-24">
      <section className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="flex flex-wrap gap-2">
            {WALLETS.map((name) => (
              <span
                key={name}
                className="rounded-full bg-primary-muted px-3 py-1 text-xs font-semibold text-primary-muted-foreground"
              >
                {name}
              </span>
            ))}
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Somali mobile-money checkout for your app
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            A TypeScript SDK, React hooks and copy-paste shadcn/ui components. Start with manual
            mode ($0 API fees) and switch to automatic payments when your merchant account is ready.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs"
              className="inline-flex h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Get started
            </Link>
            <Link
              href="/docs/components/checkout-form"
              className="inline-flex h-12 items-center rounded-xl border bg-card px-6 font-semibold hover:bg-accent"
            >
              See components
            </Link>
          </div>
          <pre className="overflow-x-auto rounded-xl border bg-card px-4 py-3 text-sm">
            <code>npx shadcn@latest add https://sompaykit.dev/r/checkout-form.json</code>
          </pre>
        </div>
        <ComponentPreview name="checkout-form" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {PARTS.map((part) => (
          <Link
            key={part.title}
            href={part.href}
            className="flex flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-primary"
          >
            <h2 className="font-mono text-sm font-semibold">{part.title}</h2>
            <p className="text-sm text-muted-foreground">{part.body}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
