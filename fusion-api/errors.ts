import type { ApiErrorBody, ApiErrorCode } from './types.ts';

/** Any non-2xx/304 response from the Fusion API. */
export class FusionApiError extends Error {
  readonly status: number;
  /** Machine code from the JSON error body, when the body was JSON. */
  readonly code: ApiErrorCode | null;
  /** The rejected value echoed by the API (`got`), if any. */
  readonly got: unknown;
  /** Seconds from `Retry-After` (429/503), if sent. */
  readonly retryAfter: number | null;
  /** Raw body text (plain-text 401/429/503 land here). */
  readonly body: string;

  constructor(
    status: number,
    message: string,
    opts: { code?: ApiErrorCode | null; got?: unknown; retryAfter?: number | null; body?: string } = {},
  ) {
    super(message);
    this.name = 'FusionApiError';
    this.status = status;
    this.code = opts.code ?? null;
    this.got = opts.got;
    this.retryAfter = opts.retryAfter ?? null;
    this.body = opts.body ?? '';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  /** 429 (too many failed logins) or 503 (outage) — safe to retry after `retryAfter`. */
  get isRetryable(): boolean {
    return this.status === 429 || this.status === 503;
  }
}

export async function toApiError(res: Response): Promise<FusionApiError> {
  const body = await res.text().catch(() => '');
  const ra = Number(res.headers.get('Retry-After'));
  const retryAfter = Number.isFinite(ra) && res.headers.has('Retry-After') ? ra : null;

  let json: Partial<ApiErrorBody> | null = null;
  try {
    json = body ? (JSON.parse(body) as Partial<ApiErrorBody>) : null;
  } catch {
    json = null;
  }

  if (json && typeof json === 'object' && typeof json.message === 'string') {
    return new FusionApiError(res.status, json.message, {
      code: json.error ?? null,
      got: json.got,
      retryAfter,
      body,
    });
  }
  return new FusionApiError(res.status, body.trim() || `HTTP ${res.status}`, { retryAfter, body });
}
