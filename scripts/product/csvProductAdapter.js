"use strict";

/**
 * Adapter between the raw Shopify product export CSV (3 row types per
 * `Handle` group - master+first-variant, rest-of-variants, images-only) and
 * a Map<handle, product> keyed by Handle, so import logic can work against
 * structured per-product data instead of a flat row array.
 *
 * Row type rules, matching Shopify's own export format:
 * - master row: `Title` is non-empty (always the first row of a Handle group)
 * - variant row: `Title` is empty but `Variant SKU` is non-empty
 * - image row: both `Title` and `Variant SKU` are empty
 */

function isMasterRow(row) {
  return Boolean(row.Title);
}

function isVariantRow(row) {
  return Boolean(row["Variant SKU"]);
}

/**
 * Groups parsed CSV rows (header-keyed objects) into a Map<handle, product>,
 * where product = { handle, masterRow, variantRows, imageRows }.
 * `masterRow` is also `variantRows[0]` (same object reference) since the
 * master row carries the first variant's data too.
 * @param {object[]} rows
 * @returns {Map<string, { handle: string, masterRow: object|null, variantRows: object[], imageRows: object[] }>}
 */
export function csvRowsToProductMap(rows) {
  const products = new Map();

  for (const row of rows) {
    const handle = (row.Handle || "").trim();
    if (!handle) continue;

    let product = products.get(handle);
    if (!product) {
      product = { handle, masterRow: null, variantRows: [], imageRows: [] };
      products.set(handle, product);
    }

    if (isMasterRow(row)) {
      product.masterRow = row;
      product.variantRows.push(row);
    } else if (isVariantRow(row)) {
      product.variantRows.push(row);
    } else {
      product.imageRows.push(row);
    }
  }

  return products;
}

/**
 * Flattens a product map back into CSV rows, preserving Map iteration order
 * (insertion order) for products and each product's own row order
 * (variant rows, including the master row, followed by image rows).
 * @param {Map<string, object>} productMap
 * @returns {object[]}
 */
export function productMapToCsvRows(productMap) {
  const rows = [];
  for (const product of productMap.values()) {
    rows.push(...product.variantRows, ...product.imageRows);
  }
  return rows;
}

/**
 * Stable identity for a variant row across origin/incoming files: `Variant
 * SKU` when present, otherwise falls back to its position among variant rows.
 */
export function variantRowKey(row, index) {
  const sku = (row["Variant SKU"] || "").trim();
  return sku || `__pos${index}`;
}

/**
 * Stable identity for an image row across origin/incoming files: `Image
 * Src` when present, otherwise falls back to its position among image rows.
 */
export function imageRowKey(row, index) {
  const src = (row["Image Src"] || "").trim();
  return src || `__pos${index}`;
}
