"use strict";

import { existsSync, readFileSync } from "fs";
import path from "path";
import Papa from "papaparse";
import { createObjectCsvWriter } from "csv-writer";
import {
  csvRowsToProductMap,
  productMapToCsvRows,
  variantRowKey,
  imageRowKey,
} from "./csvProductAdapter.js";

const MODES = ["MERGE", "UPDATE"];

function mkDefaultOutput(originCsv) {
  const dirname = path.dirname(originCsv);
  const basename = path.basename(originCsv, ".csv");
  return path.join(dirname, `${basename}_imported.csv`);
}

/**
 * Reads and parses a Shopify product CSV file.
 * @param {string} csvPath
 * @returns {{ headers: string[], rows: object[] }}
 */
function parseCsvFile(csvPath) {
  const content = readFileSync(csvPath, "utf8");
  const { data, meta } = Papa.parse(content, { header: true, skipEmptyLines: true });
  return { headers: meta.fields || [], rows: data };
}

/**
 * Union of two header lists: origin's order first, then any incoming-only
 * columns appended at the end, so no data is lost from either file.
 */
function mergeHeaderLists(originHeaders, incomingHeaders) {
  const extra = incomingHeaders.filter((header) => !originHeaders.includes(header));
  return [...originHeaders, ...extra];
}

/**
 * Copies every column in `headers` (that exists on `sourceRow`) from
 * `sourceRow` onto `targetRow`, in place. `headers` is normally the incoming
 * CSV's own header list, so only columns actually present in the incoming
 * feed are applied - columns the incoming feed doesn't mention are left
 * untouched on `targetRow`.
 */
function applyHeaders(targetRow, sourceRow, headers) {
  for (const header of headers) {
    if (header === "Handle") continue;
    if (header in sourceRow) targetRow[header] = sourceRow[header];
  }
}

function indexRowsByKey(rows, keyFn) {
  const index = new Map();
  rows.forEach((row, position) => index.set(keyFn(row, position), row));
  return index;
}

/**
 * UPDATE semantics: merges `incomingProduct`'s rows into `originProduct`'s
 * rows in place, restricted to the columns present in `incomingHeaders`.
 * A variant/image row on the incoming side with no match on the origin
 * side (e.g. a newly added variant) is appended, since there's nothing on
 * the origin side to "leave untouched".
 */
function updateProduct(originProduct, incomingProduct, incomingHeaders) {
  if (originProduct.masterRow && incomingProduct.masterRow) {
    applyHeaders(originProduct.masterRow, incomingProduct.masterRow, incomingHeaders);
  }

  const originVariantIndex = indexRowsByKey(originProduct.variantRows, variantRowKey);
  incomingProduct.variantRows.forEach((incomingRow, position) => {
    const key = variantRowKey(incomingRow, position);
    const originRow = originVariantIndex.get(key);
    if (originRow) {
      applyHeaders(originRow, incomingRow, incomingHeaders);
    } else {
      originProduct.variantRows.push({ ...incomingRow });
    }
  });

  const originImageIndex = indexRowsByKey(originProduct.imageRows, imageRowKey);
  incomingProduct.imageRows.forEach((incomingRow, position) => {
    const key = imageRowKey(incomingRow, position);
    const originRow = originImageIndex.get(key);
    if (originRow) {
      applyHeaders(originRow, incomingRow, incomingHeaders);
    } else {
      originProduct.imageRows.push({ ...incomingRow });
    }
  });
}

async function writeCsvFile(outputPath, headers, rows) {
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: headers.map((header) => ({ id: header, title: header })),
  });
  await csvWriter.writeRecords(rows);
}

async function processImport(originCsvPath, incomingCsvPath, options) {
  const origin = parseCsvFile(originCsvPath);
  const incoming = parseCsvFile(incomingCsvPath);

  const originMap = csvRowsToProductMap(origin.rows);
  const incomingMap = csvRowsToProductMap(incoming.rows);

  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const [handle, incomingProduct] of incomingMap) {
    const originProduct = originMap.get(handle);

    if (originProduct) {
      updateProduct(originProduct, incomingProduct, incoming.headers);
      updated += 1;
    } else if (options.mode === "MERGE") {
      originMap.set(handle, incomingProduct);
      created += 1;
    } else {
      console.warn(`Skipping handle "${handle}": not found in origin CSV (UPDATE mode does not create new products).`);
      skipped += 1;
    }
  }

  const outputHeaders = mergeHeaderLists(origin.headers, incoming.headers);
  const outputRows = productMapToCsvRows(originMap);
  await writeCsvFile(options.output, outputHeaders, outputRows);

  console.log(`Mode: ${options.mode}`);
  console.log(`Updated ${updated} product(s), created ${created}, skipped ${skipped}.`);
  console.log(`Wrote ${outputRows.length} row(s) to ${options.output}`);
}

export function doAction(originCsv, incomingCsv, options) {
  const resolvedOrigin = path.resolve(originCsv);
  const resolvedIncoming = path.resolve(incomingCsv);

  if (!existsSync(resolvedOrigin)) {
    console.error(`✗ Origin CSV file does not exist: ${resolvedOrigin}`);
    process.exit(1);
  }
  if (!existsSync(resolvedIncoming)) {
    console.error(`✗ Incoming CSV file does not exist: ${resolvedIncoming}`);
    process.exit(1);
  }

  const mode = String(options.mode || "UPDATE").toUpperCase();
  if (!MODES.includes(mode)) {
    console.error(`✗ Invalid --mode "${options.mode}" - must be one of: ${MODES.join(", ")}`);
    process.exit(1);
  }

  const resolvedOptions = {
    mode,
    output: options.output ? path.resolve(options.output) : mkDefaultOutput(resolvedOrigin),
  };

  processImport(resolvedOrigin, resolvedIncoming, resolvedOptions).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
