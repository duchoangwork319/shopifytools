// update-collections.mjs
// Library: updates collections against the Admin GraphQL API from the
// per-collection JSON files written by query-collections.mjs
// (<sourceDir>/store.json + <sourceDir>/<handle>.json), resolving each
// handle's `id` via <sourceDir>/collection-resource-ids.json. Collections
// are updated sequentially, one at a time: a `collectionUpdate` mutation
// first (waiting for its `job` to finish - rule changes recompute
// collection membership asynchronously), then its metafields via
// `metafieldsSet` (chunked 25 per request, Shopify's limit). Metafields are
// linked to their collection via `ownerId`, which fetchCollectionMetafields
// in query-collections.mjs stores on each metafield alongside its node data.
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFile, sleep } from './lib/io.mjs';

export const METAFIELDS_CHUNK_SIZE = 25;
const JOB_POLL_INTERVAL_MS = 1000;
const JOB_POLL_MAX_ATTEMPTS = 120;

const UPDATE_COLLECTION_MUTATION = `
  mutation UpdateCollection($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
      }
      job {
        id
        done
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const SET_COLLECTION_METAFIELDS_MUTATION = `
  mutation SetCollectionMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const COLLECTION_UPDATE_JOB_QUERY = `
  query CollectionUpdateJob($id: ID!) {
    job(id: $id) {
      id
      done
    }
  }
`;

// Whitelists the fields collectionUpdate accepts, rather than sending the
// saved collection JSON directly. `ruleSet` is only included when
// `updateRules` is set, since changing rules changes collection membership -
// manual collections have ruleSet: null, which is skipped either way.
export function buildCollectionInput(collection, { id, updateRules }) {
  const input = { id };

  // `description` is NOT in this list on purpose - it's a read-only,
  // auto-generated field on CollectionInput. Sending it raises:
  // "Field `description` is not defined by type `CollectionInput`". Use
  // `descriptionHtml` instead.
  for (const field of ['title', 'handle', 'descriptionHtml', 'templateSuffix']) {
    if (collection[field] !== undefined) {
      input[field] = collection[field];
    }
  }

  if (collection.seo != null) {
    input.seo = {};
    for (const field of ['title', 'description']) {
      if (collection.seo[field] !== undefined) {
        input.seo[field] = collection.seo[field];
      }
    }
  }

  if (updateRules && collection.ruleSet != null) {
    input.ruleSet = {
      appliedDisjunctively: collection.ruleSet.appliedDisjunctively,
      rules: collection.ruleSet.rules.map(({ column, relation, condition }) => ({ column, relation, condition })),
    };
  }

  return input;
}

// Builds the metafieldsSet input from a collection's saved `metafields`.
// Each one already carries its `ownerId` (the collection's id). Shopify
// requires metafield values to remain strings, including JSON and
// list-type values.
export function buildMetafieldsInput(metafields) {
  return (metafields ?? []).map((field) => {
    if (typeof field.value !== 'string') {
      throw new Error(`Metafield ${field.namespace}.${field.key} must have a string value.`);
    }
    return {
      ownerId: field.ownerId,
      namespace: field.namespace,
      key: field.key,
      type: field.type,
      value: field.value,
    };
  });
}

function checkUserErrors(payload) {
  if (payload.userErrors?.length) {
    throw new Error(JSON.stringify(payload.userErrors));
  }
}

async function waitForJob(client, job) {
  if (!job || job.done) return;

  for (let attempt = 0; attempt < JOB_POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(JOB_POLL_INTERVAL_MS);

    const json = await graphqlRequest(client, COLLECTION_UPDATE_JOB_QUERY, { id: job.id });
    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }
    if (!json.data.job) {
      throw new Error(`Job not found: ${job.id}`);
    }
    if (json.data.job.done) return;
  }

  throw new Error(`Timed out waiting for job ${job.id}`);
}

async function setCollectionMetafields(client, metafields) {
  const metafieldsInput = buildMetafieldsInput(metafields);

  for (let index = 0; index < metafieldsInput.length; index += METAFIELDS_CHUNK_SIZE) {
    const chunkInput = metafieldsInput.slice(index, index + METAFIELDS_CHUNK_SIZE);
    const json = await graphqlRequest(client, SET_COLLECTION_METAFIELDS_MUTATION, { metafields: chunkInput });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }
    checkUserErrors(json.data.metafieldsSet);
  }
}

async function updateCollection(client, collection, { id, updateRules, includeMetafields, dryRun }) {
  const input = buildCollectionInput(collection, { id, updateRules });

  if (dryRun) {
    console.log(`[dry run] Would update collection "${collection.handle}" with:`, JSON.stringify(input, null, 2));
    if (includeMetafields && collection.metafields?.length) {
      console.log(`[dry run] Would set ${collection.metafields.length} metafield(s) for "${collection.handle}".`);
    }
    return;
  }

  const json = await graphqlRequest(client, UPDATE_COLLECTION_MUTATION, { input });
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL error');
  }
  checkUserErrors(json.data.collectionUpdate);
  await waitForJob(client, json.data.collectionUpdate.job);

  if (includeMetafields) {
    await setCollectionMetafields(client, collection.metafields);
  }
}

// Updates collections from the per-collection JSON files written by
// query-collections.mjs: reads <sourceDir>/store.json (narrowed to
// `handles`, or every entry if omitted), resolves each handle's `id` via
// <sourceDir>/collection-resource-ids.json, and updates its writable fields,
// one collection at a time. Metafields are a separate request on top of the
// basic fields, so they're only pushed via metafieldsSet when
// `includeMetafields` is set.
export async function updateCollections({
  client,
  sourceDir,
  handles,
  updateRules = false,
  includeMetafields = false,
  dryRun = false,
}) {
  const storeFile = path.resolve(sourceDir, 'store.json');
  const store = readJsonFile(storeFile, 'collection store');
  const resourceIdsFile = path.resolve(sourceDir, 'collection-resource-ids.json');
  const collectionResourceIds = readJsonFile(resourceIdsFile, 'collection resource ids');

  const entries = handles?.length ? store.filter((entry) => handles.includes(entry.handle)) : store;
  let hadErrors = false;
  const counts = { warn: 0, success: 0, error: 0 };

  for (const entry of entries) {
    const id = collectionResourceIds[entry.handle];
    if (!id) {
      console.warn(`No collection resource ID found for handle "${entry.handle}" - skipping.`);
      counts.warn += 1;
      continue;
    }

    const collectionFile = path.resolve(entry.filePath);
    const collection = readJsonFile(collectionFile, `collection "${entry.handle}"`);

    try {
      await updateCollection(client, collection, { id, updateRules, includeMetafields, dryRun });
      console.log(`Updated: ${collection.title ?? entry.handle}`);
      counts.success += 1;
    } catch (err) {
      hadErrors = true;
      counts.error += 1;
      console.error(`Failed: ${entry.handle}: ${err.message}`);
    }
  }

  console.log(`\nWarn: ${counts.warn}, Success: ${counts.success}, Error: ${counts.error}`);

  return { hadErrors };
}
