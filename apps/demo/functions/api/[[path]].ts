// Cloudflare Pages Function for /api/*. Bind a KV namespace as DEMO_KV so payments survive
// across Workers; without it, each Worker keeps its own memory (fine for a quick look).
import { handleApi } from '../../server/api.ts';
import { apiEnvFrom, type EnvVars } from '../../server/config.ts';
import { kvStore, memoryStore, type KVLike } from '../../server/store.ts';

interface Env extends Record<string, unknown> {
  DEMO_KV?: KVLike;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const fallbackStore = memoryStore();

function vars(env: Env): EnvVars {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) if (typeof value === 'string') out[key] = value;
  return out;
}

export async function onRequest({ request, env }: PagesContext): Promise<Response> {
  const store = env.DEMO_KV ? kvStore(env.DEMO_KV) : fallbackStore;
  const response = await handleApi(request, apiEnvFrom(vars(env), store));
  return response ?? new Response('Not found', { status: 404 });
}
