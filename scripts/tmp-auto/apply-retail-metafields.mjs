#!/usr/bin/env node
// apply-retail-metafields.mjs
// Temporary automation script (not part of the admin CLI architecture):
// merges each product's retail feed data (keyed by variant SKU) into that
// product's `variants[i].metafields`, under the `five_dla` namespace - local
// file-only, no Shopify API calls. Each retail field's metafield `type` is
// looked up from the sibling `system/metafields/productvariant.json` (the
// file written by `system metafield query`/`create`), so the written shape
// matches what those commands expect. An existing metafield entry (matched
// by namespace+key) is updated in place, preserving its `id`; a field with
// no existing entry is appended without an `id`, meaning it hasn't been
// created on Shopify yet.
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

const NAMESPACE = 'five_dla';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Builds a Map<key, metafieldTypeName> from the `five_dla` entries of
// <source>/../system/metafields/productvariant.json (a sibling business
// folder of <source>, same layout as every other admin CLI business object).
function loadFieldTypes(sourceDir) {
  const definitionsFile = path.resolve(sourceDir, '..', 'system', 'metafields', 'productvariant.json');
  const definitions = readJson(definitionsFile);
  const types = new Map();
  for (const definition of definitions) {
    if (definition.namespace !== NAMESPACE) continue;
    types.set(definition.key, definition.type?.name);
  }
  return types;
}

// Builds a Map<sku, retailProductFeed> from the retail JSON's `products` array.
function loadRetailBySku(retailJsonFile) {
  const { products } = readJson(retailJsonFile);
  const bySku = new Map();
  for (const product of products) {
    if (product.sku) bySku.set(product.sku, product.retail_productfeed || {});
  }
  return bySku;
}

// Fields with no meaningful value (null, empty string, empty array) are
// skipped rather than written as an empty metafield.
function hasValue(value) {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function serializeValue(value, typeName) {
  return typeName === 'list.single_line_text_field' ? JSON.stringify(value) : String(value);
}

// Builds the { key, type, value } fields to apply to a variant from its
// retail data, skipping keys with no known metafield type (not a
// `five_dla` field) or with no meaningful value.
function buildRetailFields(retailData, fieldTypes) {
  const fields = [];
  for (const [key, value] of Object.entries(retailData)) {
    const typeName = fieldTypes.get(key);
    if (!typeName || !hasValue(value)) continue;
    fields.push({ key, type: typeName, value: serializeValue(value, typeName) });
  }
  return fields;
}

// Merges `fields` into `metafields` in place: an entry matching
// namespace+key is updated (its `id` is preserved); otherwise a new entry
// is appended without an `id`.
function mergeMetafields(metafields, fields) {
  for (const field of fields) {
    const existing = metafields.find((metafield) => metafield.namespace === NAMESPACE && metafield.key === field.key);
    if (existing) {
      existing.type = field.type;
      existing.value = field.value;
    } else {
      metafields.push({ namespace: NAMESPACE, key: field.key, type: field.type, value: field.value });
    }
  }
}

function listProductFiles(sourceDir) {
  return fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== '_resource-ids.json')
    .map((entry) => path.join(sourceDir, entry.name));
}

function processProducts(sourceDir, retailJsonFile) {
  const fieldTypes = loadFieldTypes(sourceDir);
  const retailBySku = loadRetailBySku(retailJsonFile);
  const productFiles = listProductFiles(sourceDir);

  let updatedProducts = 0;
  let updatedVariants = 0;
  let skippedVariants = 0;

  for (const file of productFiles) {
    const product = readJson(file);
    let changed = false;

    for (const variant of product.variants || []) {
      const retailData = retailBySku.get(variant.sku);
      const fields = retailData ? buildRetailFields(retailData, fieldTypes) : [];

      if (!fields.length) {
        skippedVariants += 1;
        continue;
      }

      variant.metafields = variant.metafields || [];
      mergeMetafields(variant.metafields, fields);
      updatedVariants += 1;
      changed = true;
    }

    if (changed) {
      writeJson(file, product);
      updatedProducts += 1;
    }
  }

  console.log(
    `Updated ${updatedVariants} variant(s) across ${updatedProducts} product file(s). ` +
    `Skipped ${skippedVariants} variant(s) with no matching/usable retail data.`,
  );
}

const program = new Command();
program
  .name('apply-retail-metafields')
  .description("Merge retail feed data (keyed by variant SKU) into each product's variants[i].metafields under the five_dla namespace")
  .argument('<source>', 'product business folder path, e.g. D:/working/shopify/repo/5dla-data/product')
  .argument('<retailJson>', 'retail JSON data file path (the { products: [{ sku, retail_productfeed }] } file)')
  .action((source, retailJson) => {
    const sourceDir = path.resolve(source);
    const retailJsonFile = path.resolve(retailJson);

    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exit(1);
    }
    if (!fs.existsSync(retailJsonFile)) {
      console.error(`Retail JSON file does not exist: ${retailJsonFile}`);
      process.exit(1);
    }

    processProducts(sourceDir, retailJsonFile);
  });

program.parse();
