// create-collections.mjs
// Reads the access token saved by auth.mjs and the collections to create from
// a JSON file in data/ (defaults to collections.json; pass a different file
// name/path as the first CLI arg, e.g.
// `node create-collections.mjs mens-collections-20260913.json`).
// The file may hold either a bare array of CollectionCreateInput objects
// (title/handle/sources/etc. - see
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/collectionCreate)
// or { collections: [...] }. Collections are created in chunks (10 per
// request by default), each chunk batched into one GraphQL call via aliased
// `collectionCreate` mutations, using the current `collection:
// CollectionCreateInput!` argument (the legacy `input: CollectionInput!` /
// `ruleSet` argument is deprecated and doesn't support `sources`). After
// each chunk's API call finishes, the script waits REQUEST_DELAY_MS before
// firing the next one. After each chunk, any successfully-created collection's
// handle -> id (gid://shopify/Collection/...) is merged into
// collection-resource-ids.json, written next to the collections input file -
// see data/create-collection-response.json for the response shape this is
// read from.
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const envPath = path.join(cwd, '.env', '.env.prd');
config({ path: envPath });

const { SHOPIFY_API_VERSION } = process.env;
const apiVersion = SHOPIFY_API_VERSION || '2026-04';

const CHUNK_SIZE = 10;
const REQUEST_DELAY_MS = 500;

const tokenFile = path.join(__dirname, 'data', 'access-token.json');
const collectionsInputArg = process.argv[2];

if (!collectionsInputArg) {
  console.error('Missing collections input file argument.');
  process.exit(1);
}

const collectionsFile = path.isAbsolute(collectionsInputArg)
  ? collectionsInputArg
  : path.join(__dirname, 'data', collectionsInputArg);
const resourceIdsFile = path.join(path.dirname(collectionsFile), 'collection-resource-ids.json');

function readJsonFile(file, label) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label} file: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Accepts either a bare array of CollectionInput objects, or
// { collections: [...] }.
function toCollectionList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.collections)) {
    return data.collections;
  }
  return [data];
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// Batches a chunk of collections into one GraphQL call using aliased
// `collectionCreate` mutations - one alias per collection in the chunk.
function buildBulkCollectionsMutation(collections) {
  const varDefs = [];
  const fields = [];
  const variables = {};

  collections.forEach((col, index) => {
    const varName = `input${index}`;
    const alias = `collection${index}`;

    varDefs.push(`$${varName}: CollectionInput!`);
    variables[varName] = col;

    fields.push(`
      ${alias}: collectionCreate(input: $${varName}) {
        collection {
          id
          title
          handle
          sortOrder
          ruleSet {
            appliedDisjunctively
            rules {
              column
              relation
              condition
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    `);
  });

  const mutation = `
    mutation BulkCreateCollections(${varDefs.join(', ')}) {
      ${fields.join('\n')}
    }
  `;

  return { mutation, variables };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createCollectionsChunk(shop, accessToken, collections) {
  const { mutation, variables } = buildBulkCollectionsMutation(collections);

  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GraphQL HTTP error ${response.status}: ${text}`);
  }

  return response.json();
}

function chunkHadErrors(result) {
  if (result.errors?.length) return true;
  return Object.values(result.data || {}).some((field) => field?.userErrors?.length);
}

// Pulls { handle: id } out of a BulkCreateCollections response - see
// data/create-collection-response.json for the shape (one aliased
// `collectionN` field per collection in the chunk).
function extractResourceIds(result) {
  const resourceIds = {};
  for (const field of Object.values(result.data || {})) {
    if (field?.collection?.handle && field.collection?.id) {
      resourceIds[field.collection.handle] = field.collection.id;
    }
  }
  return resourceIds;
}

function saveResourceIds(file, newResourceIds) {
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const merged = { ...existing, ...newResourceIds };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged, null, 2));
  return merged;
}

async function main() {
  const { shop, access_token: accessToken } = readJsonFile(tokenFile, 'access token');
  const collections = toCollectionList(readJsonFile(collectionsFile, 'collections'));

  if (!shop || !accessToken) {
    console.error(`${tokenFile} is missing "shop" or "access_token". Run auth.mjs first.`);
    process.exit(1);
  }

  const chunks = chunk(collections, CHUNK_SIZE);
  let hadErrors = false;

  for (const [index, collectionsChunk] of chunks.entries()) {
    console.log(
      `\nCreating chunk ${index + 1}/${chunks.length} (${collectionsChunk.length} collections)...`,
    );

    try {
      const result = await createCollectionsChunk(shop, accessToken, collectionsChunk);
      console.log(JSON.stringify(result, null, 2));

      const resourceIds = extractResourceIds(result);
      if (Object.keys(resourceIds).length) {
        saveResourceIds(resourceIdsFile, resourceIds);
        console.log(`Saved ${Object.keys(resourceIds).length} collection resource ID(s) to ${resourceIdsFile}`);
      }

      if (chunkHadErrors(result)) {
        hadErrors = true;
      }
    } catch (err) {
      hadErrors = true;
      console.error(`Chunk ${index + 1} failed:`, err.message);
    }

    const isLastChunk = index === chunks.length - 1;
    if (!isLastChunk) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  if (hadErrors) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
