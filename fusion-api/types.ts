/**
 * Types for the Fusion Product Data API v1.
 * Source: theme-azeno-v1/docs/api/fusion-products-v1.openapi.yaml
 */

export const LANGUAGES = ['da', 'en', 'de', 'nl'] as const;
export type Lang = (typeof LANGUAGES)[number];

export const VIEWS = ['json', 'sheet'] as const;
export type View = (typeof VIEWS)[number];

export const DEFAULT_BASE_URL = 'https://data.fusionworld.com/api/partners/products/v1';

/** GPSR (EU) 2023/988 art. 9 + 19 — same block on every product. */
export interface Manufacturer {
  brand: string | null;
  legal_name: string | null;
  /** Lines separated by newline. */
  postal_address: string | null;
  email: string | null;
  phone: string | null;
  /** `SCHEME:VALUE`, e.g. `CVR:26685869`. */
  identifier: string | null;
  url: string | null;
}

/** The 31 fact keys; always present, `null` or `[]` where a fact is missing. */
export interface RetailProductFeed {
  original_product_name: string | null;
  made_in: string | null;
  /** Digital product passport URL of this exact variant. */
  dpp: string | null;
  fabric_origin: string | null;
  garment_production: string | null;
  certification: string[];
  material: string | null;
  fusion_sku: string | null;
  /** Never translated. */
  colour: string | null;
  best_for: string | null;
  activities: string[];
  running_activities: string[];
  cycling_positions: string[];
  triathlon_distances: string[];
  protects_against: string[];
  season: string | null;
  fit: string | null;
  garment_length_profile: string | null;
  waist_height: string | null;
  variant_of: string | null;
  sleeve_length: string | null;
  neck_type: string | null;
  seam_construction: string | null;
  reflective_details: string | null;
  /** `0` = no pockets; `null` = unknown. */
  pockets: number | null;
  /** `false` = no zipper; `null` = unknown. */
  zipper: boolean | null;
  garment_weight_g: number | null;
  technical_summary: string | null;
  /** Steps joined with " / ". */
  care_instructions: string | null;
  /** Years. */
  warranty: number | null;
  /** Manufacturer block as one printable line. */
  brand_and_manufacturer: string | null;
}

export type RetailProductFeedKey = keyof RetailProductFeed;

/** `view=json`: one variant as data for a system. */
export interface ProductJson {
  sku: string;
  title: string | null;
  style: string | null;
  /** Time of the push in which the facts last changed. UTC, whole seconds. */
  updated_at: string;
  manufacturer: Manufacturer;
  retail_productfeed: RetailProductFeed;
  /** Key → row label in the requested `lang`, for every feed key. */
  labels: Record<string, string>;
}

export interface SheetRowLink {
  /** Certificate ID; occurs verbatim in the row `value`. */
  text: string;
  url: string;
}

export interface SheetRow {
  key: string;
  label: string;
  value: string | number | boolean;
  /** Only on the `dpp` row. */
  url?: string;
  /** Only on the `certification` row, for certificates with a public record. */
  links?: SheetRowLink[];
}

/** `view=sheet`: ordered array in print order, rows without a fact omitted. */
export type Sheet = SheetRow[];

export interface ProductsFile {
  lang: Lang;
  /** Newest change in the file — your next `updated_at_min`. */
  updated_at: string;
  /** Echoed on a delta. */
  updated_at_min?: string;
  products: ProductJson[];
}

export interface SkuListItem {
  sku: string;
  style: string | null;
  title: string | null;
}

export interface SkuList {
  total: number;
  limit: number;
  offset: number;
  items: SkuListItem[];
}

export interface StyleListItem {
  style: string;
  variants: number;
  title: string | null;
}

export interface StyleList {
  total: number;
  items: StyleListItem[];
}

export interface Health {
  ok: true;
  updated_at: string;
  /** Variants per language. */
  products: number;
  languages: string[];
}

export type ApiErrorCode =
  | 'unknown_language'
  | 'unknown_view'
  | 'bad_updated_at_min'
  | 'bad_limit'
  | 'bad_offset'
  | 'not_found'
  | 'unavailable';

export interface ApiErrorBody {
  error: ApiErrorCode;
  message: string;
  got?: unknown;
}

// ---- request options -------------------------------------------------------

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface ProductOptions extends RequestOptions {
  /** Default `en`. */
  lang?: Lang;
}

export interface ListProductsOptions extends RequestOptions {
  /** Default `en`. */
  lang?: Lang;
  /** ISO 8601 UTC, strictly after. Max 35 chars. Omit for the whole file. */
  updatedAtMin?: string | Date;
}

/** Adds `If-Modified-Since` — used by the `*IfModified` methods. */
export type WithIfModifiedSince<O> = O & {
  /** A previous `Last-Modified` value (HTTP date) or Date. */
  ifModifiedSince: string | Date;
};

export interface ListSkusOptions extends RequestOptions {
  /** 1–1000, default 100. */
  limit?: number;
  /** >= 0, default 0. */
  offset?: number;
  /** Only the SKUs of one style. */
  style?: string;
}

/** Result of a conditional GET. `notModified` has no `data`. */
export type Conditional<T> =
  | { notModified: false; data: T; lastModified: string | null; contentLanguage: string | null }
  | { notModified: true; data?: undefined; lastModified: string | null; contentLanguage: string | null };
