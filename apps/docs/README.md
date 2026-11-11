# sompaykit.dev (docs + registry)

Fumadocs 15 on Next.js 15, exported as static files (`out/`). It also serves the free shadcn
registry at `/r/<item>.json` (copied from `registry/dist/r` at build time).

```bash
pnpm dev                                  # from the repo root: every app
pnpm turbo run build --filter=@sompaykit/docs   # → apps/docs/out
node apps/docs/scripts/serve.mjs          # serve out/ on http://localhost:3000
```

- Pages live in `content/docs/*.mdx`; order in `meta.json`.
- Live previews (`components/previews/*`) import the registry components straight from
  `registry/src`, so docs always show the code users install.
- Theme: `registry/src/styles/sompaykit.css`, mapped onto Fumadocs' colors in `app/global.css`.
- Search is a prebuilt index (`/api/search`), searched in the browser.

## Test a real `shadcn add` locally

```bash
REGISTRY_URL=http://localhost:3000 pnpm --filter @sompaykit/registry build
pnpm --filter @sompaykit/docs build       # copies registry/dist/r → public/r → out/r
node apps/docs/scripts/serve.mjs
# in a Next.js + shadcn/ui project:
npx shadcn@latest add http://localhost:3000/r/checkout-form.json
```

Rebuild the registry without `REGISTRY_URL` before deploying.

## Cloudflare Pages

| Setting          | Value                                           |
| ---------------- | ----------------------------------------------- |
| Root directory   | `/` (repo root)                                 |
| Build command    | `pnpm turbo run build --filter=@sompaykit/docs` |
| Output directory | `apps/docs/out`                                 |
| Env              | `NODE_VERSION=22`                               |

`public/_headers` sets JSON content types for `/r/*` and `/api/search`.
TODO(VERIFY): first real deploy on Cloudflare Pages.
