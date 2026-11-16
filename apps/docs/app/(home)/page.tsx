import Link from 'next/link';
import { ComponentPreview } from '~/components/component-preview';
import { InstallCommand } from '~/components/install-command';

const STEPS = [
  {
    title: 'The customer types their number',
    body: 'The prefix picks the wallet: 61 is EVC Plus, 63 is Zaad. No dropdown to get wrong.',
  },
  {
    title: 'They pay from their phone',
    body: 'In manual mode, “Dial to pay” fills in the USSD code. Or send them to a SifaloPay payment page.',
  },
  {
    title: 'Your server confirms it',
    body: 'The order moves from waiting to paid. The total always comes from your database, never the browser.',
  },
];

const PACKAGES = [
  {
    name: '@sompaykit/core',
    body: 'Phone numbers, wallet detection, USSD codes and payment providers. No dependencies; runs anywhere fetch does.',
    href: '/docs/core',
  },
  {
    name: '@sompaykit/react',
    body: 'usePayment and usePaymentStatus: start a payment and follow it, with no double charges on slow data.',
    href: '/docs/react',
  },
  {
    name: 'Checkout components',
    body: 'Checkout form, wallet picker, manual pay card and payment status for shadcn/ui, in Somali, English and Arabic.',
    href: '/docs/components/checkout-form',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-4 pt-14 pb-16 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 lg:pb-24">
        <div className="flex flex-col justify-center gap-8">
          <h1 className="text-[2.6rem] leading-[1.04] font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.25rem]">
            Accept EVC&nbsp;Plus, Zaad, Sahal and eDahab in your&nbsp;app
          </h1>
          <p className="max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            A TypeScript SDK, React hooks and copy-paste checkout components for Somali mobile
            money. Start today in manual mode with no API fees, and switch to automatic payments
            when your merchant account is ready.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs"
              className="inline-flex h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              Get started
            </Link>
            <Link
              href="/docs/components/checkout-form"
              className="inline-flex h-12 items-center rounded-xl border bg-card px-6 font-semibold hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Browse components
            </Link>
          </div>
          <div className="max-w-[34rem]">
            <InstallCommand command="npx shadcn@latest add https://sompaykit.aoubak.com/r/checkout-form.json" />
          </div>
        </div>

        {/* The one bold element: the live checkout on a brand slab, with Somalia's +252 below it. */}
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#5b2fd1] p-4 pb-28 sm:p-8 sm:pb-36 dark:bg-[#2a1a63]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[0.2em] -left-[0.04em] -z-10 text-[9rem] leading-none font-black tracking-[-0.06em] text-white/15 select-none sm:text-[12rem] dark:text-white/10"
          >
            +252
          </span>
          <ComponentPreview
            name="checkout-form"
            className="my-0 rounded-2xl border-0 shadow-[0_24px_60px_-20px_rgb(20_8_60/0.55)]"
          />
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
          <h2 className="max-w-xl text-3xl font-bold tracking-[-0.025em] text-balance">
            From phone number to paid, in three steps
          </h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 items-center justify-center rounded-full bg-primary-muted text-sm font-bold text-primary-muted-foreground tabular-nums"
                >
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:py-20 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold tracking-[-0.025em]">Take only what you need</h2>
          <p className="leading-relaxed text-muted-foreground">
            Free and MIT licensed. Use the SDK on its own, or add the components to a shadcn/ui app.
          </p>
        </div>
        <ul className="divide-y border-y">
          {PACKAGES.map((pkg) => (
            <li key={pkg.name}>
              <Link
                href={pkg.href}
                className="group grid gap-1 py-5 focus-visible:outline-none sm:grid-cols-[14rem_1fr] sm:gap-6"
              >
                <span className="font-semibold group-hover:text-primary group-focus-visible:text-primary group-focus-visible:underline">
                  {pkg.name}
                </span>
                <span className="leading-relaxed text-muted-foreground">{pkg.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <p className="max-w-2xl text-lg leading-relaxed">
          Built by Aoub, and already taking real payments on{' '}
          <a
            href="https://aoubak.com"
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            aoubak.com
          </a>
          . The code is on{' '}
          <a
            href="https://github.com/aoubak/sompaykit"
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            GitHub
          </a>
          ; Somali developers are especially welcome to contribute.
        </p>
      </section>
    </main>
  );
}
