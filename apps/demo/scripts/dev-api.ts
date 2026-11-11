// Local stand-in for the Pages Function: serves /api/* on port 8788 (wrangler's default), and
// `next dev` forwards /api/* here. Run with Node 22.18+ (TypeScript types are stripped natively).
import { createServer } from 'node:http';
import { handleApi } from '../server/api.ts';
import { apiEnvFrom } from '../server/config.ts';
import { memoryStore } from '../server/store.ts';

const PORT = Number(process.env.API_PORT ?? 8788);
const env = apiEnvFrom(process.env, memoryStore());

createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const method = req.method ?? 'GET';
    const request = new Request(new URL(req.url ?? '/', `http://localhost:${PORT}`), {
      method,
      headers: req.headers as Record<string, string>,
      ...(method !== 'GET' && method !== 'HEAD' && { body: Buffer.concat(chunks) }),
    });
    handleApi(request, env)
      .then(async (response) => {
        const result = response ?? new Response('Not found', { status: 404 });
        res.writeHead(result.status, Object.fromEntries(result.headers));
        res.end(Buffer.from(await result.arrayBuffer()));
      })
      .catch((error: unknown) => {
        process.stderr.write(`API error: ${String(error)}\n`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end('{"errorCode":"PROVIDER_ERROR"}');
      });
  });
}).listen(PORT, () => {
  process.stdout.write(`Demo API on http://localhost:${PORT}/api\n`);
});
