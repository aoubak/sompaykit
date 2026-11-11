// Serves the static export (out/) like Cloudflare Pages would: `/docs` → out/docs.html, and
// extensionless files (the /api/search index) as JSON, as public/_headers does there.
// Only for local checks such as a real `npx shadcn add http://localhost:3000/r/…`.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const PORT = Number(process.env.PORT ?? 3000);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^[/\\]+/, '');
  if (clean.startsWith('..')) return null;
  const base = join(OUT, clean);
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

createServer(async (req, res) => {
  const path = await resolve(new URL(req.url ?? '/', 'http://localhost').pathname);
  const file = path ?? join(OUT, '404.html');
  res.writeHead(path ? 200 : 404, {
    'Content-Type':
      TYPES[extname(file)] ?? (extname(file) === '' ? TYPES['.json'] : 'application/octet-stream'),
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  process.stdout.write(`Serving out/ on http://localhost:${PORT}\n`);
});
