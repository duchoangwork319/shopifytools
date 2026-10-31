// query-collections.mjs
// Library: queries collections from the Admin GraphQL API - all of them
// (paged), by exact handle(s), or by a title search (wildcard supported,
// e.g. "*summer*"). Each collection is written to its own
// `<sourceDir>/<handle>.json`, enriched in place with a `metafields`
// property fetched (paged) per collection.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { writeJsonFile, readJsonFileIfExists, saveResourceIds } from './lib/io.mjs';

const COLLECTION_FIELDS = `
  id
  title
  handle
  description
  descriptionHtml
  templateSuffix
  seo {
    title
    description
  }
  ruleSet {
    appliedDisjunctively
    rules {
      column
      relation
      condition
    }
  }
`;

const GET_ALL_COLLECTIONS_QUERY = `
  query GetAllCollections($cursor: String) {
    collections(first: 100, after: $cursor) {
      edges {
        cursor
        node {
          ${COLLECTION_FIELDS}
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const SEARCH_COLLECTIONS_BY_TITLE_QUERY = `
  query SearchCollectionsByTitle($query: String!, $first: Int!, $after: String) {
    collections(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          ${COLLECTION_FIELDS}
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const GET_COLLECTION_BY_HANDLE_QUERY = `
  query GetCollectionByHandle($query: String!) {
    collections(first: 1, query: $query) {
      edges {
        node {
          ${COLLECTION_FIELDS}
        }
      }
    }
  }
`;

const GET_COLLECTION_METAFIELDS_QUERY = `
  query GetCollectionMetafields($id: ID!, $cursor: String) {
    collection(id: $id) {
      metafields(first: 250, after: $cursor) {
        edges {
          cursor
          node {
            id
            namespace
            key
            type
            value
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`;

// Pages through every collection.
export async function fetchAllCollections(client) {
  let cursor = null;
  let hasNextPage = true;
  const allCollections = [];

  while (hasNextPage) {
    const json = await graphqlRequest(client, GET_ALL_COLLECTIONS_QUERY, { cursor });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    const connection = json.data.collections;
    for (const edge of connection.edges) {
      allCollections.push(edge.node);
      cursor = edge.cursor;
    }

    hasNextPage = connection.pageInfo.hasNextPage;
  }

  return allCollections;
}

// Pages through collections matching a title search (wildcard supported,
// e.g. "*summer*").
export async function fetchCollectionsByTitle(client, titlePattern) {
  const results = [];
  let after = null;
  let page = 1;

  do {
    console.log(`Fetching page ${page} for title "${titlePattern}"...`);
    const json = await graphqlRequest(client, SEARCH_COLLECTIONS_BY_TITLE_QUERY, {
      query: `title:${titlePattern}`,
      first: 50,
      after,
    });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    const connection = json.data.collections;
    for (const edge of connection.edges) {
      results.push(edge.node);
    }

    const lastEdge = connection.edges[connection.edges.length - 1];
    after = connection.pageInfo.hasNextPage && lastEdge ? lastEdge.cursor : null;
    page += 1;
  } while (after);

  return results;
}

// Fetches a single collection by its exact handle, or null if none matches.
export async function fetchCollectionByHandle(client, handle) {
  const json = await graphqlRequest(client, GET_COLLECTION_BY_HANDLE_QUERY, { query: `handle:'${handle}'` });

  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL error');
  }

  return json.data.collections.edges[0]?.node ?? null;
}

// Pages through every metafield of a single collection.
export async function fetchCollectionMetafields(client, collectionId) {
  let cursor = null;
  let hasNextPage = true;
  const metafields = [];

  while (hasNextPage) {
    const json = await graphqlRequest(client, GET_COLLECTION_METAFIELDS_QUERY, { id: collectionId, cursor });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    if (!json.data.collection) {
      throw new Error(`Collection no longer exists: ${collectionId}`);
    }

    const connection = json.data.collection.metafields;
    for (const edge of connection.edges) {
      // Metafields are linked to their collection via `ownerId` - carry it
      // along so update-collections.mjs can pass it straight to
      // metafieldsSet without needing the collection's id separately.
      metafields.push({ ...edge.node, ownerId: collectionId });
      cursor = edge.cursor;
    }

    hasNextPage = connection.pageInfo.hasNextPage;
  }

  return metafields;
}

// Fetches and attaches a single collection's metafields as a `metafields`
// property. Collections are enriched one at a time (by the caller, looping)
// to avoid a large burst of API requests.
async function withMetafields(client, collection) {
  console.log(`Fetching metafields for "${collection.handle}"...`);
  const metafields = await fetchCollectionMetafields(client, collection.id);
  return { ...collection, metafields };
}

// Picks the fields written to each collection's JSON file.
function toEntry({ title, handle, description, descriptionHtml, templateSuffix, seo, ruleSet, metafields }) {
  return { title, handle, description, descriptionHtml, templateSuffix, seo, ruleSet, metafields };
}

// Fetches collections (by `handles`, by `title` search, or all of them if
// neither is given) and writes one JSON file per collection -
// `<sourceDir>/<handle>.json` ({ title, handle, description, descriptionHtml,
// templateSuffix, seo, ruleSet, metafields }) - plus `<sourceDir>/store.json`
// ({ handle, title, filePath }[], appended to, never truncated) and
// `<sourceDir>/collection-resource-ids.json` ({ handle: id }).
//
// Metafields are a separate, per-collection paged request on top of the
// basic fields, so they're only fetched when `includeMetafields` is set -
// otherwise each collection's JSON file simply has no `metafields` property.
//
// When `includeMetafields` is set, each collection's JSON file is written
// twice: first right after fetching (without `metafields`), then again once
// its metafields have been fetched - so a run that's interrupted mid-way
// still leaves usable per-collection files on disk.
export async function queryCollections({ client, sourceDir, handles, title, includeMetafields = false }) {
  fs.mkdirSync(sourceDir, { recursive: true });

  let collections;
  if (handles?.length) {
    collections = [];
    for (const handle of handles) {
      const collection = await fetchCollectionByHandle(client, handle);
      if (!collection) {
        console.warn(`No collection found for handle "${handle}" - skipping.`);
        continue;
      }
      collections.push(collection);
    }
  } else if (title) {
    collections = await fetchCollectionsByTitle(client, title);
  } else {
    collections = await fetchAllCollections(client);
  }

  const collectionFile = (handle) => path.resolve(sourceDir, `${handle}.json`);

  for (const collection of collections) {
    // Metafields aren't fetched yet at this point - when they're not being
    // refreshed this run (includeMetafields: false), carry over whatever
    // metafields this collection's file already has instead of wiping them.
    const existing = readJsonFileIfExists(collectionFile(collection.handle), null);
    const metafields = includeMetafields ? collection.metafields : existing?.metafields;
    writeJsonFile(collectionFile(collection.handle), toEntry({ ...collection, metafields }));
  }
  console.log(`Saved ${collections.length} collection JSON file(s) to ${sourceDir}`);

  const storeFile = path.resolve(sourceDir, 'store.json');
  const store = readJsonFileIfExists(storeFile, []);
  const existingHandles = new Set(store.map((entry) => entry.handle));
  for (const collection of collections) {
    if (existingHandles.has(collection.handle)) continue;
    store.push({ handle: collection.handle, title: collection.title, filePath: collectionFile(collection.handle) });
    existingHandles.add(collection.handle);
  }
  writeJsonFile(storeFile, store);
  console.log(`Saved ${store.length} collection entrie(s) to ${storeFile}`);

  if (includeMetafields) {
    for (const collection of collections) {
      const enriched = await withMetafields(client, collection);
      writeJsonFile(collectionFile(collection.handle), toEntry(enriched));
    }
  }

  const resourceIdsFile = path.resolve(sourceDir, 'collection-resource-ids.json');
  const newResourceIds = {};
  for (const { handle, id } of collections) {
    newResourceIds[handle] = id;
  }
  const resourceIds = saveResourceIds(resourceIdsFile, newResourceIds);
  console.log(`Saved ${Object.keys(resourceIds).length} collection resource ID(s) to ${resourceIdsFile}`);

  return { count: collections.length };
}
