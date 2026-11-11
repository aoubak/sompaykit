import { RootProvider } from 'fumadocs-ui/provider';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
// Fonts ship as npm packages, so builds never download them (works offline and on slow links).
import '@fontsource-variable/geist/wght.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://sompaykit.dev'),
  title: { default: 'SomPayKit', template: '%s · SomPayKit' },
  description:
    'Accept EVC Plus, Zaad, Sahal and eDahab in your app. TypeScript SDK, React hooks and shadcn/ui components.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* Static export: search reads a prebuilt index from /api/search. */}
        <RootProvider search={{ options: { type: 'static' } }}>{children}</RootProvider>
      </body>
    </html>
  );
}
