'use client';

import type { MobileWallet } from '@sompaykit/core';
import { useState } from 'react';
import { WalletPicker } from '@/components/sompaykit/wallet-picker';
import type { DemoProps } from '../component-preview';

export function WalletPickerDemo({ locale }: DemoProps) {
  const [wallet, setWallet] = useState<MobileWallet | null>('evc');

  return (
    <div className="flex flex-col gap-3">
      <WalletPicker value={wallet} onChange={setWallet} locale={locale} />
      <p className="text-xs text-muted-foreground">
        value: <code>{JSON.stringify(wallet)}</code>
      </p>
    </div>
  );
}
