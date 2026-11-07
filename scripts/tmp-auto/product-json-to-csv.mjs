#!/usr/bin/env node
// product-json-to-csv.mjs
// Temporary automation script (not part of the admin CLI architecture):
// converts a JSON file of API-fetched products - { products: [...] } (see
// 5dla-data/products/full-product-sample.json for the shape) into a CSV.
// The first 3 columns are SKU, Style, Title. The rest of the columns come
// from each product's `labels` property (its keys, in first-seen order,
// using the label's display name as the column header) - cell values are
// read from the matching key in `retail_productfeed`, not from `labels`
// itself. Array values are joined with "; ", null/undefined become "".
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const FIXED_COLUMNS = ['SKU', 'Style', 'Title'];

// Collects every label key (in first-seen order across all products) and
// its display name, so products with slightly different label sets still
// produce one consistent header row.
function collectLabelColumns(products) {
  const labelNameByKey = new Map();
  for (const product of products) {
    for (const [key, name] of Object.entries(product.labels ?? {})) {
      if (!labelNameByKey.has(key)) labelNameByKey.set(key, name);
    }
  }
  return labelNameByKey;
}

function formatValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join('; ');
  return String(value);
}

export function buildProductCsv(products) {
  const labelNameByKey = collectLabelColumns(products);
  const labelKeys = [...labelNameByKey.keys()];
  const header = [...FIXED_COLUMNS, ...labelKeys.map((key) => labelNameByKey.get(key))];

  const rows = products.map((product) => {
    const feed = product.retail_productfeed ?? {};
    return [
      product.sku ?? '',
      product.style ?? '',
      product.title ?? '',
      ...labelKeys.map((key) => formatValue(feed[key])),
    ];
  });

  return Papa.unparse([header, ...rows]);
}

const program = new Command();
program
  .name('product-json-to-csv')
  .description('Converts a product JSON file ({ products: [...] }) into a CSV (SKU, Style, Title, then one column per labels entry)')
  .argument('<jsonSource>', 'path to the product JSON file ({ products: [...] })')
  .argument('[csvOutput]', 'path to write the CSV to (default: <jsonSource> with a .csv extension, same folder)')
  .action((jsonSource, csvOutput) => {
    const jsonFile = path.resolve(jsonSource);
    if (!fs.existsSync(jsonFile)) {
      console.error(`Missing JSON file: ${jsonFile}`);
      process.exitCode = 1;
      return;
    }

    const { products } = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    if (!Array.isArray(products)) {
      console.error(`Expected ${jsonFile} to contain a top-level "products" array.`);
      process.exitCode = 1;
      return;
    }

    const csv = buildProductCsv(products);
    const outputFile = csvOutput
      ? path.resolve(csvOutput)
      : path.resolve(path.dirname(jsonFile), `${path.basename(jsonFile, path.extname(jsonFile))}.csv`);

    fs.writeFileSync(outputFile, csv, 'utf8');
    console.log(`Saved ${products.length} row(s) to ${outputFile}`);
  });

program.parseAsync(process.argv);
