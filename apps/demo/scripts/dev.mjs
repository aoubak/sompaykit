// `pnpm dev`: the API stand-in (port 8788) and `next dev` (PORT, default 3001), stopped together.
import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['scripts/dev-api.ts'], { stdio: 'inherit' }),
  spawn('pnpm', ['exec', 'next', 'dev', '--port', process.env.PORT ?? '3001'], {
    stdio: 'inherit',
    shell: true,
  }),
];

function stop() {
  for (const child of children) child.kill();
  process.exit();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', stop);
