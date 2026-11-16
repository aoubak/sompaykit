// Builds the shadcn registry: registry.json + source files → dist/r/<item>.json, the same format
// `shadcn build` writes. Our own script so the theme comes straight from src/styles/sompaykit.css
// (one source of truth) and so builds need no extra download.
//
//   node scripts/build-registry.mjs                 → https://sompaykit.aoubak.com/r/…
//   REGISTRY_URL=http://localhost:3000 node …       → for a local `shadcn add` test
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
const BASE_ITEM = 'sompaykit-base';
const THEME_ITEM = 'sompaykit-theme';

/** Colors every shadcn project already defines. `sompaykit-base` never touches them. */
export const SHADCN_COLOR_VARS = new Set([
  'radius',
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
]);

/**
 * Brand shades in `sompaykit-base`, worked out from the project's own `--primary`, so components
 * match any shadcn theme. `sompaykit-theme` replaces them with the exact SomPayKit purples.
 */
export const PRIMARY_SHADES = {
  light: {
    'primary-hover': 'color-mix(in oklab, var(--primary) 82%, black)',
    'primary-muted': 'color-mix(in oklab, var(--primary) 12%, var(--background))',
    'primary-muted-foreground': 'color-mix(in oklab, var(--primary) 75%, var(--foreground))',
  },
  dark: {
    'primary-hover': 'color-mix(in oklab, var(--primary) 82%, white)',
    'primary-muted': 'color-mix(in oklab, var(--primary) 25%, var(--background))',
    'primary-muted-foreground': 'color-mix(in oklab, var(--primary) 45%, var(--foreground))',
  },
};

/** Reads `--name: value;` pairs from one top-level CSS block, e.g. `:root { … }`. */
export function readCssVars(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No "${selector}" block in the theme CSS`);
  const end = css.indexOf('\n}', start);
  const vars = {};
  for (const match of css.slice(start, end).matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

/** The theme CSS, the single source of truth for tokens. */
export function readThemeCss() {
  return readFile(join(ROOT, 'src/styles/sompaykit.css'), 'utf8');
}

/** Drops the colors every shadcn project already has, and swaps in the derived brand shades. */
function onlyOwnVars(vars, shades) {
  const own = Object.fromEntries(Object.entries(vars).filter(([k]) => !SHADCN_COLOR_VARS.has(k)));
  return { ...own, ...shades };
}

/**
 * shadcn `cssVars` + `css`, from our CSS file.
 * - `base`: what every component needs, without changing the project's own colors. shadcn only
 *   adds variables a project is missing, because the item is a `registry:lib`.
 * - `theme`: the full SomPayKit look. A `registry:theme`, so shadcn replaces existing colors.
 */
export function themeFromCss(css) {
  const theme = readCssVars(css, '@theme inline');
  const light = readCssVars(css, ':root');
  const dark = readCssVars(css, '.dark');
  // Only the Arabic font: projects load Geist their own way (e.g. next/font).
  const fonts = { 'font-arabic': theme['font-arabic'] };
  const arabic = { '@layer base': { ':lang(ar)': { 'font-family': 'var(--font-arabic)' } } };
  return {
    base: {
      cssVars: {
        theme: fonts,
        light: onlyOwnVars(light, PRIMARY_SHADES.light),
        dark: onlyOwnVars(dark, PRIMARY_SHADES.dark),
      },
      css: arabic,
    },
    theme: { cssVars: { theme: fonts, light, dark }, css: arabic },
  };
}

/** Our own item names become full URLs; shadcn names (`button`) stay as they are. */
function resolveDependency(name, ownNames, registryUrl) {
  return ownNames.has(name) ? `${registryUrl}/r/${name}.json` : name;
}

export async function buildRegistry({ registryUrl = 'https://sompaykit.aoubak.com' } = {}) {
  const registry = JSON.parse(await readFile(join(ROOT, 'registry.json'), 'utf8'));
  const ownNames = new Set(registry.items.map((item) => item.name));
  const css = themeFromCss(await readThemeCss());

  const items = [];
  for (const item of registry.items) {
    const files = [];
    for (const file of item.files ?? []) {
      const content = (await readFile(join(ROOT, file.path), 'utf8')).replace(/\r\n/g, '\n');
      files.push({ ...file, content });
    }
    items.push({
      $schema: ITEM_SCHEMA,
      ...item,
      ...(item.registryDependencies && {
        registryDependencies: item.registryDependencies.map((name) =>
          resolveDependency(name, ownNames, registryUrl),
        ),
      }),
      files,
      ...(item.name === BASE_ITEM && css.base),
      ...(item.name === THEME_ITEM && css.theme),
    });
  }
  return { index: { ...registry, items: registry.items }, items };
}

async function main() {
  const registryUrl = (process.env.REGISTRY_URL ?? 'https://sompaykit.aoubak.com').replace(
    /\/$/,
    '',
  );
  const out = join(ROOT, 'dist', 'r');
  const { index, items } = await buildRegistry({ registryUrl });
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await writeFile(join(out, 'registry.json'), `${JSON.stringify(index, null, 2)}\n`);
  for (const item of items) {
    await writeFile(join(out, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }
  process.stdout.write(`Built ${items.length} registry items for ${registryUrl} → dist/r\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
