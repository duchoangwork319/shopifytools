import { FusionApiError, toApiError } from './errors.ts';
import {
  DEFAULT_BASE_URL,
  LANGUAGES,
  VIEWS,
  type Conditional,
  type Health,
  type Lang,
  type ListProductsOptions,
  type ListSkusOptions,
  type ProductJson,
  type ProductOptions,
  type ProductsFile,
  type RequestOptions,
  type Sheet,
  type SkuList,
  type SkuListItem,
  type StyleList,
  type View,
  type WithIfModifiedSince,
} from './types.ts';

export interface FusionClientConfig {
  username: string;
  password: string;
  /** Defaults to the production v1 URL. */
  baseUrl?: string;
  /** Custom fetch (tests, proxies, older runtimes). Defaults to global `fetch`. */
  fetch?: typeof fetch;
  /** Per-request timeout in ms. Default 60000 (the full file is ~9 MB uncompressed). */
  timeoutMs?: number;
  /** Retries for `503` only (honouring `Retry-After`). Default 2. `429` is never retried. */
  maxRetries?: number;
}

const SKU_RE = /^[A-Za-z0-9-]{1,40}$/;
const GTIN_RE = /^[0-9]{13}$/;
const MAX_UPDATED_AT_MIN = 35;
const MAX_RETRY_WAIT_MS = 60_000;

function basicAuth(username: string, password: string): string {
  // Works in Node and browsers, and tolerates non-Latin1 characters.
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `Basic ${btoa(bin)}`;
}

function assertLang(lang: string): asserts lang is Lang {
  if (!(LANGUAGES as readonly string[]).includes(lang)) {
    throw new RangeError(`lang must be one of ${LANGUAGES.join(', ')}; got ${JSON.stringify(lang)}`);
  }
}

function assertView(view: string): asserts view is View {
  if (!(VIEWS as readonly string[]).includes(view)) {
    throw new RangeError(`view must be one of ${VIEWS.join(', ')}; got ${JSON.stringify(view)}`);
  }
}

function toIso(value: string | Date): string {
  const s = value instanceof Date ? value.toISOString().replace(/\.\d{3}Z$/, 'Z') : value;
  if (s.length > MAX_UPDATED_AT_MIN) {
    throw new RangeError(`updatedAtMin must be at most ${MAX_UPDATED_AT_MIN} characters`);
  }
  return s;
}

function toHttpDate(value: string | Date): string {
  return value instanceof Date ? value.toUTCString() : value;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

type Query = Record<string, string | number | undefined>;

interface InternalRequest {
  path: string;
  query?: Query;
  ifModifiedSince?: string | Date;
  accept?: string;
  signal?: AbortSignal;
}

/**
 * Client for the Fusion Product Data API v1 (read-only, HTTP Basic).
 *
 * Works in Node >= 20 and browsers. NOTE: don't ship real credentials in a browser bundle —
 * in the React app, call this from a dev-server/back-end proxy instead.
 */
export class FusionClient {
  readonly baseUrl: string;
  readonly #auth: string;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  readonly #maxRetries: number;

  constructor(config: FusionClientConfig) {
    if (!config.username || !config.password) {
      throw new Error('FusionClient: username and password are required');
    }
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.#auth = basicAuth(config.username, config.password);
    this.#fetch = config.fetch ?? ((...a) => fetch(...a));
    this.#timeoutMs = config.timeoutMs ?? 60_000;
    this.#maxRetries = config.maxRetries ?? 2;
  }

  // ---- core ---------------------------------------------------------------

  async #send(req: InternalRequest): Promise<Response> {
    const url = new URL(this.baseUrl + req.path);
    for (const [k, v] of Object.entries(req.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = {
      Authorization: this.#auth,
      Accept: req.accept ?? 'application/json',
    };
    if (req.ifModifiedSince !== undefined) headers['If-Modified-Since'] = toHttpDate(req.ifModifiedSince);

    for (let attempt = 0; ; attempt++) {
      const timeout = AbortSignal.timeout(this.#timeoutMs);
      const signal = req.signal ? AbortSignal.any([req.signal, timeout]) : timeout;
      const res = await this.#fetch(url, { method: 'GET', headers, signal });

      if (res.ok || res.status === 304) return res;

      const err = await toApiError(res);
      if (res.status === 503 && attempt < this.#maxRetries) {
        const wait = Math.min((err.retryAfter ?? 30) * 1000, MAX_RETRY_WAIT_MS);
        await sleep(wait, req.signal);
        continue;
      }
      throw err;
    }
  }

  async #json<T>(req: InternalRequest): Promise<T> {
    const res = await this.#send(req);
    return (await res.json()) as T;
  }

  async #conditional<T>(req: InternalRequest): Promise<Conditional<T>> {
    const res = await this.#send(req);
    const meta = {
      lastModified: res.headers.get('Last-Modified'),
      contentLanguage: res.headers.get('Content-Language'),
    };
    if (res.status === 304) return { notModified: true, ...meta };
    return { notModified: false, data: (await res.json()) as T, ...meta };
  }

  // ---- products -----------------------------------------------------------

  #productRequest(
    path: string,
    view: View,
    opts: ProductOptions & { ifModifiedSince?: string | Date },
  ): InternalRequest {
    const lang = opts.lang;
    if (lang !== undefined) assertLang(lang);
    assertView(view);
    return { path, query: { lang, view }, ifModifiedSince: opts.ifModifiedSince, signal: opts.signal };
  }

  #skuPath(sku: string): string {
    if (!SKU_RE.test(sku)) throw new RangeError(`Invalid SKU ${JSON.stringify(sku)} (A-Z a-z 0-9 -, max 40)`);
    return `/product/${encodeURIComponent(sku)}`;
  }

  #gtinPath(gtin: string): string {
    if (!GTIN_RE.test(gtin)) throw new RangeError(`Invalid GTIN-13 ${JSON.stringify(gtin)}`);
    return `/product/gtin/${gtin}`;
  }

  /** One variant by Fusion SKU, `view=json`. Throws `FusionApiError` (404) if withdrawn/unknown. */
  getProduct(sku: string, opts: ProductOptions = {}): Promise<ProductJson> {
    return this.#json(this.#productRequest(this.#skuPath(sku), 'json', opts));
  }

  /** One variant by Fusion SKU, `view=sheet` (display rows). */
  getProductSheet(sku: string, opts: ProductOptions = {}): Promise<Sheet> {
    return this.#json(this.#productRequest(this.#skuPath(sku), 'sheet', opts));
  }

  /** One variant by GTIN-13, `view=json`. */
  getProductByGtin(gtin: string, opts: ProductOptions = {}): Promise<ProductJson> {
    return this.#json(this.#productRequest(this.#gtinPath(gtin), 'json', opts));
  }

  /** One variant by GTIN-13, `view=sheet`. */
  getProductSheetByGtin(gtin: string, opts: ProductOptions = {}): Promise<Sheet> {
    return this.#json(this.#productRequest(this.#gtinPath(gtin), 'sheet', opts));
  }

  /** Conditional GET by SKU (`json`). Returns `{notModified: true}` on 304. */
  getProductIfModified(
    sku: string,
    opts: WithIfModifiedSince<ProductOptions>,
  ): Promise<Conditional<ProductJson>> {
    return this.#conditional(this.#productRequest(this.#skuPath(sku), 'json', opts));
  }

  /** Conditional GET by GTIN (`json`). */
  getProductByGtinIfModified(
    gtin: string,
    opts: WithIfModifiedSince<ProductOptions>,
  ): Promise<Conditional<ProductJson>> {
    return this.#conditional(this.#productRequest(this.#gtinPath(gtin), 'json', opts));
  }

  // ---- products file / delta ---------------------------------------------

  #productsRequest(opts: ListProductsOptions & { ifModifiedSince?: string | Date }): InternalRequest {
    if (opts.lang !== undefined) assertLang(opts.lang);
    return {
      path: '/products',
      query: {
        lang: opts.lang,
        updated_at_min: opts.updatedAtMin === undefined ? undefined : toIso(opts.updatedAtMin),
      },
      ifModifiedSince: opts.ifModifiedSince,
      signal: opts.signal,
    };
  }

  /**
   * Every product of one language (~3,000, ~9 MB JSON), or — with `updatedAtMin` — only
   * those changed strictly after that time. The next cursor is `result.updated_at`.
   */
  listProducts(opts: ListProductsOptions = {}): Promise<ProductsFile> {
    return this.#json(this.#productsRequest(opts));
  }

  /** Conditional variant of {@link listProducts}. */
  listProductsIfModified(
    opts: WithIfModifiedSince<ListProductsOptions>,
  ): Promise<Conditional<ProductsFile>> {
    return this.#conditional(this.#productsRequest(opts));
  }

  /**
   * Incremental sync helper: pass the cursor from the previous call (omit the first time to
   * get the whole file). Returns the changed products and the cursor to store for next time.
   */
  async syncProducts(
    cursor?: string | null,
    opts: Omit<ListProductsOptions, 'updatedAtMin'> = {},
  ): Promise<{ products: ProductJson[]; cursor: string; lang: Lang; full: boolean }> {
    const file = await this.listProducts({ ...opts, updatedAtMin: cursor ?? undefined });
    return { products: file.products, cursor: file.updated_at, lang: file.lang, full: !cursor };
  }

  // ---- lists --------------------------------------------------------------

  /** One page of SKUs (sorted by SKU). The server clamps out-of-range limit/offset. */
  listSkus(opts: ListSkusOptions = {}): Promise<SkuList> {
    for (const [name, v] of [['limit', opts.limit], ['offset', opts.offset]] as const) {
      if (v !== undefined && !Number.isInteger(v)) throw new RangeError(`${name} must be an integer`);
    }
    return this.#json({
      path: '/skus',
      query: { limit: opts.limit, offset: opts.offset, style: opts.style },
      signal: opts.signal,
    });
  }

  /** Iterate every SKU (optionally one style), paging transparently. */
  async *iterateSkus(
    opts: Omit<ListSkusOptions, 'offset'> = {},
  ): AsyncGenerator<SkuListItem, void, undefined> {
    const limit = opts.limit ?? 1000;
    let offset = 0;
    for (;;) {
      const page = await this.listSkus({ ...opts, limit, offset });
      yield* page.items;
      offset += page.items.length;
      if (page.items.length === 0 || offset >= page.total) return;
    }
  }

  /** Collect every SKU into an array. */
  async getAllSkus(opts: Omit<ListSkusOptions, 'offset' | 'limit'> = {}): Promise<SkuListItem[]> {
    const out: SkuListItem[] = [];
    for await (const item of this.iterateSkus(opts)) out.push(item);
    return out;
  }

  /** Every style with its variant count (not paged, <300 rows). */
  listStyles(opts: RequestOptions = {}): Promise<StyleList> {
    return this.#json({ path: '/styles', signal: opts.signal });
  }

  // ---- service ------------------------------------------------------------

  /** Liveness + newest `updated_at`. Also a cheap way to verify credentials. */
  health(opts: RequestOptions = {}): Promise<Health> {
    return this.#json({ path: '/health', signal: opts.signal });
  }

  /** The current v1 OpenAPI definition as YAML text. */
  async getOpenApi(opts: RequestOptions = {}): Promise<string> {
    const res = await this.#send({ path: '/openapi.yaml', accept: 'application/yaml', signal: opts.signal });
    return res.text();
  }
}

export { FusionApiError };
