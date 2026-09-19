// update-collections.mjs
// Reads the access token saved by auth.mjs and the collections to update from
// a JSON file passed as the first CLI arg (a bare array of CollectionInput
// objects, keyed by `handle` - no `id`, e.g.
// `node update-collections.mjs collections/men/collections.json`).
// collection-resource-ids.json (written by create-collections.mjs) must
// already exist next to the input file - it's read to map each collection's
// `handle` to its real `id` (gid://shopify/Collection/...), since the
// `collectionUpdate` mutation requires `id` and the input file only has
// `handle`. Collections are updated in chunks (10 per request by default),
// each chunk batched into one GraphQL call via aliased `collectionUpdate`
// mutations, using the legacy `input: CollectionInput!` argument (same as
// create-collections.mjs, since the current data uses `ruleSet` rather than
// `sources`). After each chunk's API call finishes, the script waits
// REQUEST_DELAY_MS before firing the next one.
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

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// Resolves each collection's `handle` to its real `id` via the
// { handle: id } map from collection-resource-ids.json. Collections whose
// handle isn't in the map are dropped (and reported) since collectionUpdate
// can't run without an id.
function resolveCollectionIds(collections, collectionResourceIds) {
  const resolved = [];
  for (const col of collections) {
    const id = collectionResourceIds[col.handle];
    if (!id) {
      console.warn(`No collection resource ID found for handle "${col.handle}" - skipping.`);
      continue;
    }
    resolved.push({ ...col, id });
  }
  return resolved;
}

// Batches a chunk of collections into one GraphQL call using aliased
// `collectionUpdate` mutations - one alias per collection in the chunk.
function buildBulkUpdateMutation(collections) {
  const varDefs = [];
  const fields = [];
  const variables = {};

  collections.forEach((col, index) => {
    const varName = `input${index}`;
    const alias = `collection${index}`;
    const { handle, ...input } = col;

    varDefs.push(`$${varName}: CollectionInput!`);
    variables[varName] = input;

    fields.push(`
      ${alias}: collectionUpdate(input: $${varName}) {
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
    mutation BulkUpdateCollections(${varDefs.join(', ')}) {
      ${fields.join('\n')}
    }
  `;

  return { mutation, variables };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateCollectionsChunk(shop, accessToken, collections) {
  const { mutation, variables } = buildBulkUpdateMutation(collections);

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

async function main() {
  const { shop, access_token: accessToken } = readJsonFile(tokenFile, 'access token');
  const collections = readJsonFile(collectionsFile, 'collections');
  const collectionResourceIds = readJsonFile(resourceIdsFile, 'collection resource ids');

  if (!shop || !accessToken) {
    console.error(`${tokenFile} is missing "shop" or "access_token". Run auth.mjs first.`);
    process.exit(1);
  }

  const collectionsWithIds = resolveCollectionIds(collections, collectionResourceIds);
  const chunks = chunk(collectionsWithIds, CHUNK_SIZE);
  let hadErrors = false;

  for (const [index, collectionsChunk] of chunks.entries()) {
    console.log(
      `\nUpdating chunk ${index + 1}/${chunks.length} (${collectionsChunk.length} collections)...`,
    );

    try {
      const result = await updateCollectionsChunk(shop, accessToken, collectionsChunk);
      console.log(JSON.stringify(result, null, 2));

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
