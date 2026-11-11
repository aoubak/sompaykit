// Local copy of shadcn/ui's `cn` helper so registry items typecheck. Not published:
// every shadcn project already has `@/lib/utils`.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
