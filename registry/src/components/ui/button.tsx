// Local stand-in for shadcn/ui's Button so registry items typecheck and test. Not published:
// items list `button` in registryDependencies, so users get shadcn's real one.
import type * as React from 'react';
import { cn } from '@/lib/utils';

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

const sizes = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 gap-1.5 rounded-md px-3',
  lg: 'h-10 rounded-md px-6',
  icon: 'size-9',
} as const;

export interface ButtonVariantProps {
  variant?: keyof typeof variants | null | undefined;
  size?: keyof typeof sizes | null | undefined;
  className?: string | undefined;
}

export function buttonVariants({ variant, size, className }: ButtonVariantProps = {}): string {
  return cn(base, variants[variant ?? 'default'], sizes[size ?? 'default'], className);
}

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & Omit<ButtonVariantProps, 'className'>) {
  return (
    <button
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
