import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ShopProvider } from '~/lib/shop';
// Fonts ship as npm packages, so builds never download them (works offline and on slow links).
import '@fontsource-variable/geist/wght.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import './global.css';

export const metadata: Metadata = {
  title: 'SomPayKit demo shop',
  description: 'Pay with EVC Plus, Zaad, Sahal or eDahab. A demo of SomPayKit; no real money.',
  robots: { index: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#5b2fd1' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="so">
      <body className="min-h-dvh">
        <ShopProvider>{children}</ShopProvider>
      </body>
    </html>
  );
}
