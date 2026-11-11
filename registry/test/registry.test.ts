import { describe, expect, it } from 'vitest';
import { buildRegistry, readCssVars, readThemeCss } from '../scripts/build-registry.mjs';

const SHADCN_PROVIDED: Record<string, string> = {
  '@/lib/utils': 'utils', // every shadcn project has it
  '@/components/ui/button': 'button',
  '@/components/ui/input': 'input',
};

const { items } = await buildRegistry({ registryUrl: 'https://example.test' });
const css = await readThemeCss();
const byName = new Map(items.map((item) => [item.name, item]));

/** Targets of an item and every SomPayKit item it pulls in. */
function installedTargets(name: string, seen = new Set<string>()): Set<string> {
  const item = byName.get(name);
  if (!item || seen.has(name)) return new Set();
  seen.add(name);
  const targets = new Set(item.files.map((f) => f.target.replace(/\.tsx?$/, '')));
  for (const dep of item.registryDependencies ?? []) {
    const own = /\/r\/([\w-]+)\.json$/.exec(dep)?.[1];
    if (own) for (const t of installedTargets(own, seen)) targets.add(t);
  }
  return targets;
}

describe('registry build', () => {
  it('builds every item with file contents', () => {
    expect(items.map((i) => i.name)).toEqual([
      'sompaykit-base',
      'wallet-picker',
      'checkout-form',
      'manual-pay-card',
      'payment-status',
    ]);
    for (const item of items) {
      expect(item.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json');
      for (const file of item.files) expect(file.content.length).toBeGreaterThan(0);
    }
  });

  it('turns our own dependencies into full URLs', () => {
    expect(byName.get('checkout-form')?.registryDependencies).toEqual([
      'button',
      'input',
      'https://example.test/r/sompaykit-base.json',
      'https://example.test/r/wallet-picker.json',
    ]);
  });

  it.each(items.map((i) => i.name))('%s: every import is installed with it', (name) => {
    const item = byName.get(name);
    if (!item) throw new Error(name);
    const targets = installedTargets(name);
    const shadcn = new Set(item.registryDependencies ?? []);
    const npm = new Set(item.dependencies ?? []);

    for (const file of item.files) {
      for (const [, spec] of file.content.matchAll(/from '([^']+)'/g)) {
        if (!spec) continue;
        if (spec === 'react') continue;
        if (spec.startsWith('@/')) {
          const provided = SHADCN_PROVIDED[spec];
          if (provided === 'utils') continue;
          if (provided) expect(shadcn, `${file.path} → ${spec}`).toContain(provided);
          else expect(targets, `${file.path} → ${spec}`).toContain(spec.slice(2));
        } else {
          expect(npm, `${file.path} → ${spec}`).toContain(spec);
        }
      }
    }
  });

  it('ships the theme CSS file as shadcn cssVars', () => {
    const base = byName.get('sompaykit-base');
    expect(base?.cssVars?.light).toEqual(readCssVars(css, ':root'));
    expect(base?.cssVars?.dark).toEqual(readCssVars(css, '.dark'));
    expect(base?.cssVars?.light).toMatchObject({
      primary: '#5b2fd1',
      success: '#157a52',
      background: '#f6f5fa',
      radius: '0.75rem',
    });
    expect(Object.keys(base?.cssVars?.dark ?? {})).toEqual(
      Object.keys(base?.cssVars?.light ?? {}).filter((k) => k !== 'radius'),
    );
  });
});
