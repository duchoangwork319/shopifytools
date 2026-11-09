// product/update.mjs
// Library: updates product variant metafields against the Admin GraphQL API,
// sourced from the per-product JSON files written by `product query`
// (<sourceDir>/<handle>.json, each already carrying its own handle/title/
// variants - unlike collections/menus/pages, products have no separate
// _searchable-attrs.json). Products can be narrowed down by comma-separated
// handles and/or a title pattern (exact string, glob-style wildcard, or
// /regex/flags).
//
// Shopify's product object itself (title, description, images, pricing,
// etc.) is best bulk-updated via a CSV import (`product import` in
// scripts/product) rather than this GraphQL-based command - this command
// only pushes each variant's `metafields` (via metafieldsSet), so callers
// must opt in with `includeMetafields`; otherwise nothing is updated.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from '../lib/api-client.mjs';
import { readJsonFile, sleep } from '../lib/io.mjs';
import { FILE } from '../lib/constants.mjs';

export const METAFIELDS_CHUNK_SIZE = 25;

const SET_VARIANT_METAFIELDS_MUTATION = `
  mutation SetVariantMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

// Builds a matcher for a title pattern: a /regex/flags literal, a
// glob-style wildcard (using * and ?), or an exact (case-insensitive)
// title match.
export function titleMatcher(pattern) {
  const regexLiteral = pattern.match(/^\/(.*)\/([a-z]*)$/i);
  if (regexLiteral) {
    const [, body, flags] = regexLiteral;
    return new RegExp(body, flags);
  }

  if (pattern.includes('*') || pattern.includes('?')) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
  }

  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

// Lists every product entry in sourceDir (every *.json file except
// FILE.RESOURCE_IDS), reading each one's own handle/title/variants.
function listProductEntries(sourceDir) {
  return fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== FILE.RESOURCE_IDS)
    .map((entry) => readJsonFile(path.join(sourceDir, entry.name), `product "${entry.name}"`));
}

// Narrows product entries down to the given `handles` (every one must
// exist) and/or `title` (exact/wildcard/regex, via titleMatcher). With
// neither given, every entry is selected.
export function selectEntries(entries, { title, handles = [] } = {}) {
  let selected = entries;

  if (handles.length) {
    selected = handles.map((handle) => {
      const entry = entries.find((e) => e.handle === handle);
      if (!entry) {
        console.error(`Handle "${handle}" not found.`);
        process.exit(1);
      }
      return entry;
    });
  }

  if (title) {
    const matcher = titleMatcher(title);
    selected = selected.filter((entry) => matcher.test(entry.title));
  }

  return selected;
}

// Builds the metafieldsSet input from every variant's saved `metafields`.
// Shopify requires metafield values to remain strings, including JSON and
// list-type values.
export function buildMetafieldsInput(product) {
  return (product.variants ?? []).flatMap((variant) =>
    (variant.metafields ?? []).map((field) => {
      if (typeof field.value !== 'string') {
        throw new Error(`Metafield ${field.namespace}.${field.key} on variant ${variant.id} must have a string value.`);
      }
      return {
        ownerId: variant.id,
        namespace: field.namespace,
        key: field.key,
        type: field.type,
        value: field.value,
      };
    }),
  );
}

async function setVariantMetafields(client, metafieldsInput) {
  for (let offset = 0; offset < metafieldsInput.length; offset += METAFIELDS_CHUNK_SIZE) {
    const batch = metafieldsInput.slice(offset, offset + METAFIELDS_CHUNK_SIZE);
    const json = await graphqlRequest(client, SET_VARIANT_METAFIELDS_MUTATION, { metafields: batch });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }
    if (json.data.metafieldsSet.userErrors?.length) {
      throw new Error(JSON.stringify(json.data.metafieldsSet.userErrors));
    }
  }
}

// Updates product variant metafields from the per-product JSON files
// written by `product query`: reads every `<sourceDir>/<handle>.json`
// (narrowed to `handles`/`title`, or every entry if neither is given) and
// pushes each variant's `metafields` via metafieldsSet, chunked 25 per
// request (Shopify's limit).
//
// `includeMetafields` must be set, or this logs a warning and returns
// without updating anything - there's currently nothing else for this
// command to update (product data itself should go through `product
// import`, a CSV-based command, instead). `sleepMs`, when set, pauses for
// that many milliseconds after each product is processed (success, error,
// skip, or dry run alike) - useful to stay under the API's rate limit.
export async function updateProducts({ client, sourceDir, handles = [], title, includeMetafields = false, dryRun = false, sleepMs = 0 }) {
  if (!includeMetafields) {
    console.warn(
      'Nothing to update: this command only supports updating Product Variant Metafields (pass --update-metafields). ' +
      'To update product data itself (title, description, images, pricing, etc.), use the CSV-based "product import" command instead.',
    );
    return { hadErrors: false };
  }

  const entries = listProductEntries(sourceDir);
  const selected = selectEntries(entries, { title, handles });

  let hadErrors = false;
  const counts = { warn: 0, success: 0, error: 0 };

  for (const product of selected) {
    let metafieldsInput;
    try {
      metafieldsInput = buildMetafieldsInput(product);
    } catch (err) {
      hadErrors = true;
      counts.error += 1;
      console.error(`Failed: ${product.handle}: ${err.message}`);
      if (sleepMs) await sleep(sleepMs);
      continue;
    }

    if (!metafieldsInput.length) {
      console.warn(`No variant metafields to update for "${product.handle}" - skipping.`);
      counts.warn += 1;
      if (sleepMs) await sleep(sleepMs);
      continue;
    }

    if (dryRun) {
      console.log(`[dry run] Would set ${metafieldsInput.length} variant metafield(s) for "${product.handle}".`);
      counts.success += 1;
      if (sleepMs) await sleep(sleepMs);
      continue;
    }

    try {
      await setVariantMetafields(client, metafieldsInput);
      console.log(`Updated ${metafieldsInput.length} variant metafield(s) for "${product.title ?? product.handle}".`);
      counts.success += 1;
    } catch (err) {
      hadErrors = true;
      counts.error += 1;
      console.error(`Failed: ${product.handle}: ${err.message}`);
    }

    if (sleepMs) await sleep(sleepMs);
  }

  console.log(`\nWarn: ${counts.warn}, Success: ${counts.success}, Error: ${counts.error}`);

  return { hadErrors };
}
