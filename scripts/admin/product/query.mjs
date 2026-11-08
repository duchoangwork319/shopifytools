// product/query.mjs
// Library: queries every product via a bulk operation (the Admin API has no
// cursor-paginated way to fetch every product with its variants and
// metafields in one pass, so a bulk query is used instead, same as Shopify's
// own bulk export tooling). Each product is written to its own
// `<sourceDir>/<handle>.json` ({ id, handle, title, variants: [{ id, sku,
// metafields }] }), plus `<sourceDir>/_resource-ids.json` ({ [handle]: { id,
// handle, title, variants: { [sku]: variantId } } }).
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { createInterface } from 'readline';
import { graphqlRequest } from '../lib/api-client.mjs';
import { writeJsonFile, saveResourceIds, sleep } from '../lib/io.mjs';
import { FILE } from '../lib/constants.mjs';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

const RUN_PRODUCT_EXPORT_MUTATION = `
  mutation RunProductExport {
    bulkOperationRunQuery(
      query: """
        {
          products {
            edges {
              node {
                id
                handle
                title
                variants {
                  edges {
                    node {
                      id
                      sku
                      metafields {
                        edges {
                          node {
                            id
                            namespace
                            key
                            type
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      """
    ) {
      bulkOperation {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_BULK_OPERATION_STATUS_QUERY = `
  query GetBulkOperationStatus($id: ID!) {
    node(id: $id) {
      ... on BulkOperation {
        status
        errorCode
        url
      }
    }
  }
`;

// Starts a bulk query export of every product (id, handle, title, variants
// with sku + metafields) and returns the bulk operation's id.
export async function runProductExport(client) {
  const json = await graphqlRequest(client, RUN_PRODUCT_EXPORT_MUTATION, {});

  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL error');
  }

  const result = json.data.bulkOperationRunQuery;
  if (result.userErrors.length) {
    throw new Error(JSON.stringify(result.userErrors));
  }
  if (!result.bulkOperation) {
    throw new Error('Shopify did not return a bulk operation.');
  }

  return result.bulkOperation.id;
}

// Polls a bulk operation until it completes, returning its export URL (or
// null when the export produced no file, i.e. there was nothing to export).
export async function waitForBulkOperation(client, id) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const json = await graphqlRequest(client, GET_BULK_OPERATION_STATUS_QUERY, { id });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    const operation = json.data.node;
    if (!operation) {
      throw new Error(`Bulk operation not found: ${id}`);
    }

    console.log(`Export status: ${operation.status}`);

    if (operation.status === 'COMPLETED') {
      return operation.url ?? null;
    }

    if (['FAILED', 'CANCELED', 'EXPIRED'].includes(operation.status)) {
      throw new Error(`Export ${operation.status}: ${operation.errorCode ?? 'unknown error'}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Polling timed out. Shopify's export may still be running: ${id}`);
}

// Downloads and parses the bulk operation's JSONL export, joining variants
// and metafields onto their parent product regardless of line order, into
// one entry per product: { id, handle, title, variants: [{ id, sku, metafields }] }.
export async function downloadProductExport(url) {
  if (!url) return [];

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Export download failed: HTTP ${response.status}`);
  }

  const products = new Map();
  const variants = new Map();
  const metafields = [];

  const lines = createInterface({ input: Readable.fromWeb(response.body), crlfDelay: Infinity });

  for await (const line of lines) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);

    if (record.id.startsWith('gid://shopify/Product/')) {
      products.set(record.id, { id: record.id, handle: record.handle, title: record.title, variants: [] });
    } else if (record.id.startsWith('gid://shopify/ProductVariant/')) {
      variants.set(record.id, { id: record.id, sku: record.sku, metafields: [], __parentId: record.__parentId });
    } else if (record.id.startsWith('gid://shopify/Metafield/')) {
      metafields.push(record);
    }
  }

  for (const { __parentId, ...metafield } of metafields) {
    const variant = variants.get(__parentId);
    if (!variant) throw new Error(`Missing parent variant: ${__parentId}`);
    variant.metafields.push(metafield);
  }

  for (const { __parentId, ...variant } of variants.values()) {
    const product = products.get(__parentId);
    if (!product) throw new Error(`Missing parent product: ${__parentId}`);
    product.variants.push(variant);
  }

  return Array.from(products.values());
}

// Normal handles remain unchanged; encode unsafe filename characters.
function filenameForHandle(handle) {
  return `${encodeURIComponent(handle).replace(/\./g, '%2E')}.json`;
}

// Runs a full product export (bulk operation) and writes one
// `<sourceDir>/<handle>.json` per product plus `<sourceDir>/_resource-ids.json`
// ({ [handle]: { id, handle, title, variants: { [sku]: variantId } } }).
export async function queryProducts({ client, sourceDir }) {
  fs.mkdirSync(sourceDir, { recursive: true });

  console.log('Starting product export...');
  const operationId = await runProductExport(client);
  console.log(`Started export: ${operationId}`);

  const url = await waitForBulkOperation(client, operationId);
  const products = await downloadProductExport(url);

  for (const product of products) {
    writeJsonFile(path.join(sourceDir, filenameForHandle(product.handle)), product);
  }
  console.log(`Saved ${products.length} product JSON file(s) to ${sourceDir}`);

  const resourceIdsFile = path.join(sourceDir, FILE.RESOURCE_IDS);
  const newResourceIds = {};
  for (const { id, handle, title, variants } of products) {
    const variantsBySku = {};
    for (const variant of variants) {
      if (variant.sku) variantsBySku[variant.sku] = variant.id;
    }
    newResourceIds[handle] = { id, handle, title, variants: variantsBySku };
  }
  const resourceIds = saveResourceIds(resourceIdsFile, newResourceIds);
  console.log(`Saved ${Object.keys(resourceIds).length} product resource ID(s) to ${resourceIdsFile}`);

  return { count: products.length };
}
