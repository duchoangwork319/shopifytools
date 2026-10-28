// update-collections.mjs
// Library: updates collections against the Admin GraphQL API from a JSON
// input (a bare array of CollectionInput objects, keyed by `handle` - no
// `id`). resourceIdsFile (written by create-collections.mjs) must already
// exist - it's read to map each collection's `handle` to its real `id`
// (gid://shopify/Collection/...), since the `collectionUpdate` mutation
// requires `id` and the input file only has `handle`. Collections are
// updated in chunks (10 per request by default), each chunk batched into
// one GraphQL call via aliased `collectionUpdate` mutations, using the
// legacy `input: CollectionInput!` argument (same as create-collections.mjs,
// since the current data uses `ruleSet` rather than `sources`). After each
// chunk's API call finishes, the caller waits `delayMs` before firing the
// next one.
import { graphqlRequest } from './lib/api-client.mjs';
import { chunk, readJsonFile, sleep } from './lib/io.mjs';

export const DEFAULT_CHUNK_SIZE = 10;
export const DEFAULT_DELAY_MS = 500;

// Resolves each collection's `handle` to its real `id` via the
// { handle: id } map from resourceIdsFile. Collections whose handle isn't
// in the map are dropped (and reported) since collectionUpdate can't run
// without an id.
export function resolveCollectionIds(collections, collectionResourceIds) {
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
export function buildBulkUpdateMutation(collections) {
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

export async function updateCollectionsChunk(client, collections) {
  const { mutation, variables } = buildBulkUpdateMutation(collections);
  return graphqlRequest(client, mutation, variables);
}

export function chunkHadErrors(result) {
  if (result.errors?.length) return true;
  return Object.values(result.data || {}).some((field) => field?.userErrors?.length);
}

// Reads collections from collectionsFile and resourceIdsFile, resolves
// handles to ids, and updates them, chunked.
export async function updateCollections({
  client,
  collectionsFile,
  resourceIdsFile,
  chunkSize = DEFAULT_CHUNK_SIZE,
  delayMs = DEFAULT_DELAY_MS,
}) {
  const collections = readJsonFile(collectionsFile, 'collections');
  const collectionResourceIds = readJsonFile(resourceIdsFile, 'collection resource ids');

  const collectionsWithIds = resolveCollectionIds(collections, collectionResourceIds);
  const chunks = chunk(collectionsWithIds, chunkSize);
  let hadErrors = false;

  for (const [index, collectionsChunk] of chunks.entries()) {
    console.log(
      `\nUpdating chunk ${index + 1}/${chunks.length} (${collectionsChunk.length} collections)...`,
    );

    try {
      const result = await updateCollectionsChunk(client, collectionsChunk);
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
      await sleep(delayMs);
    }
  }

  return { hadErrors };
}
