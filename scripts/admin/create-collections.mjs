// create-collections.mjs
// Library: creates collections against the Admin GraphQL API from a JSON
// input (a bare array of CollectionCreateInput objects (title/handle/
// sources/etc. - see
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/collectionCreate)
// or { collections: [...] }). Collections are created in chunks (10 per
// request by default), each chunk batched into one GraphQL call via aliased
// `collectionCreate` mutations, using the current `collection:
// CollectionCreateInput!` argument (the legacy `input: CollectionInput!` /
// `ruleSet` argument is deprecated and doesn't support `sources`). After
// each chunk's API call finishes, the caller waits `delayMs` before firing
// the next one. After each chunk, any successfully-created collection's
// handle -> id (gid://shopify/Collection/...) is merged into
// resourceIdsFile - see data/create-collection-response.json for the
// response shape this is read from.
import { graphqlRequest } from './lib/api-client.mjs';
import { chunk, readJsonFile, saveResourceIds, sleep } from './lib/io.mjs';

export const DEFAULT_CHUNK_SIZE = 10;
export const DEFAULT_DELAY_MS = 500;

// Accepts either a bare array of CollectionInput objects, or
// { collections: [...] }.
export function toCollectionList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.collections)) {
    return data.collections;
  }
  return [data];
}

// Batches a chunk of collections into one GraphQL call using aliased
// `collectionCreate` mutations - one alias per collection in the chunk.
export function buildBulkCollectionsMutation(collections) {
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

export async function createCollectionsChunk(client, collections) {
  const { mutation, variables } = buildBulkCollectionsMutation(collections);
  return graphqlRequest(client, mutation, variables);
}

export function chunkHadErrors(result) {
  if (result.errors?.length) return true;
  return Object.values(result.data || {}).some((field) => field?.userErrors?.length);
}

// Pulls { handle: id } out of a BulkCreateCollections response - see
// data/create-collection-response.json for the shape (one aliased
// `collectionN` field per collection in the chunk).
export function extractResourceIds(result) {
  const resourceIds = {};
  for (const field of Object.values(result.data || {})) {
    if (field?.collection?.handle && field.collection?.id) {
      resourceIds[field.collection.handle] = field.collection.id;
    }
  }
  return resourceIds;
}

// Reads collections from collectionsFile and creates them, chunked, merging
// resource IDs into resourceIdsFile as each chunk completes.
export async function createCollections({
  client,
  collectionsFile,
  resourceIdsFile,
  chunkSize = DEFAULT_CHUNK_SIZE,
  delayMs = DEFAULT_DELAY_MS,
}) {
  const collections = toCollectionList(readJsonFile(collectionsFile, 'collections'));
  const chunks = chunk(collections, chunkSize);
  let hadErrors = false;

  for (const [index, collectionsChunk] of chunks.entries()) {
    console.log(
      `\nCreating chunk ${index + 1}/${chunks.length} (${collectionsChunk.length} collections)...`,
    );

    try {
      const result = await createCollectionsChunk(client, collectionsChunk);
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
      await sleep(delayMs);
    }
  }

  return { hadErrors };
}
