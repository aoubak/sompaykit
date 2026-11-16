# sompaykit.aoubak.com (docs + registry)

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

## Vercel (free Hobby plan)

Settings live in `vercel.json`; the Vercel project only needs **Root Directory = `apps/docs`**.
Every push to `main` redeploys.

| Setting        | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Root directory | `apps/docs`                                                 |
| Framework      | Other (plain static files)                                  |
| Install        | `pnpm install --frozen-lockfile` (whole workspace)          |
| Build          | `cd ../.. && pnpm turbo run build --filter=@sompaykit/docs` |
| Output         | `out`                                                       |

`vercel.json` also sets JSON content types and CORS for `/r/*` and `/api/search`.

### Domain `sompaykit.aoubak.com`

aoubak.com's DNS is on Cloudflare. Add the domain in the Vercel project, then in Cloudflare DNS:

| Type  | Name        | Target                                | Proxy                     |
| ----- | ----------- | ------------------------------------- | ------------------------- |
| CNAME | `sompaykit` | the value Vercel shows for the domain | **DNS only** (grey cloud) |

Keep the proxy off, so Vercel can issue the HTTPS certificate.
