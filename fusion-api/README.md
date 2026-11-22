# fusion-api

TypeScript client for the **Fusion Product Data API v1** (read-only, HTTP Basic).
Source of truth: `theme-azeno-v1/docs/api/fusion-products-v1.openapi.yaml`.

Zero runtime dependencies (native `fetch`); works in Node >= 20 and browsers.
Only `env.ts` uses `dotenv` (already a project dependency) and is Node-only.

## Files

| File | Purpose |
| --- | --- |
| `types.ts` | All schemas (`ProductJson`, `Sheet`, `ProductsFile`, ...) and option types |
| `errors.ts` | `FusionApiError` (status, `code`, `retryAfter`, `isNotFound`, ...) |
| `client.ts` | `FusionClient` with one method per operation |
| `helpers.ts` | `sheetToMap`, `productToRows`, `indexBySku` |
| `env.ts` | Node-only `createClientFromEnv()` |
| `index.ts` | Public barrel (browser-safe) |

## Credentials

```
FUSION_API_USER=...
FUSION_API_PASSWORD=...
# FUSION_API_BASE_URL=https://data.fusionworld.com/api/partners/products/v1
```

## Usage (CLI / Node 24 runs `.ts` directly)

```ts
import { createClientFromEnv } from '../fusion-api/env.ts';

const fusion = createClientFromEnv();
await fusion.health();                                   // also verifies credentials

const p = await fusion.getProduct('56-BO-LO-0266-NIB-M', { lang: 'da' });
const sheet = await fusion.getProductSheet('56-BO-LO-0266-NIB-M', { lang: 'de' });
const byGtin = await fusion.getProductByGtin('8400780076462');

// whole language (~9 MB JSON, gzipped on the wire), then deltas
let { products, cursor } = await fusion.syncProducts(null, { lang: 'en' });
({ products, cursor } = await fusion.syncProducts(cursor, { lang: 'en' })); // only changes

// conditional GET
const r = await fusion.getProductIfModified('56-BO-LO-0266-NIB-M', { ifModifiedSince: lastModified });
if (!r.notModified) store(r.data, r.lastModified);

// lists
for await (const s of fusion.iterateSkus({ style: '56-BO-LO-0266' })) console.log(s.sku);
const styles = await fusion.listStyles();
```

Errors: `catch (e) { if (e instanceof FusionApiError && e.isNotFound) ... }`.
A withdrawn SKU is `404`. `503` is retried automatically (default 2x, honouring
`Retry-After`); `429` (too many failed logins) is never retried.

## React app

Import types and the client from `../../fusion-api/index.ts`. **Do not put the
Basic credentials in the browser bundle** (Vite inlines `VITE_*` vars). Either call the
library from a small Express route (express is already a dependency) / Vite dev proxy
that injects the `Authorization` header, or point `baseUrl` at that proxy and pass dummy
credentials.

## Typecheck

```
npx tsc -p fusion-api/tsconfig.json --noEmit
```
