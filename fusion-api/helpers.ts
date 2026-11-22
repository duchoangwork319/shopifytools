import type { ProductJson, Sheet, SheetRow } from './types.ts';

/** Turn a `view=sheet` array into `{ key: row }`. */
export function sheetToMap(sheet: Sheet): Record<string, SheetRow> {
  return Object.fromEntries(sheet.map((r) => [r.key, r]));
}

/** Render a stored json document as printable rows using its own `labels` (no second call). */
export function productToRows(p: ProductJson): Array<{ key: string; label: string; value: string }> {
  const rows: Array<{ key: string; label: string; value: string }> = [];
  for (const [key, raw] of Object.entries(p.retail_productfeed)) {
    if (raw === null || (Array.isArray(raw) && raw.length === 0)) continue;
    rows.push({
      key,
      label: p.labels[key] ?? key,
      value: Array.isArray(raw) ? raw.join(', ') : String(raw),
    });
  }
  return rows;
}

/** Index products by upper-cased SKU (SKUs are case-insensitive). */
export function indexBySku(products: ProductJson[]): Map<string, ProductJson> {
  return new Map(products.map((p) => [p.sku.toUpperCase(), p]));
}
