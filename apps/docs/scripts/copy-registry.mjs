// Copies the built registry (registry/dist/r) to public/r, so the site serves /r/<item>.json.
// Run `pnpm --filter @sompaykit/registry build` first (turbo does it for `pnpm build`).
import { cp, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(APP, '..', '..', 'registry', 'dist', 'r');
const to = join(APP, 'public', 'r');

try {
  await stat(join(from, 'registry.json'));
} catch {
  process.stderr.write(
    'registry/dist/r not found. Run `pnpm --filter @sompaykit/registry build` first.\n',
  );
  process.exit(1);
}

await rm(to, { recursive: true, force: true });
await cp(from, to, { recursive: true });
process.stdout.write('Copied registry/dist/r → public/r\n');
