// query-collections-wildcard.mjs
// Library: queries collections by title (wildcard supported, e.g.
// "*summer*"), and appends any collections not already present in a current
// collections input JSON file. The current collections file may hold either
// a bare array of collection objects (matched here by `handle`) or
// { collections: [...] } - same shapes accepted/produced by
// create-collections.mjs. Newly found collections are appended as
// { id, title, handle, ruleSet }.
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFileIfExists, saveResourceIds, writeJsonFile } from './lib/io.mjs';

const SEARCH_COLLECTIONS_BY_TITLE_QUERY = `
  query SearchCollectionsByTitle($query: String!, $first: Int!, $after: String) {
    collections(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          id
          title
          handle
          ruleSet {
            appliedDisjunctively
            rules {
              column
              relation
              condition
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

// Accepts either a bare array of collection objects, or { collections: [...] }.
export function toCollectionList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.collections)) {
    return data.collections;
  }
  return [data];
}

export async function fetchCollectionsByTitleWildcard(client, titleWildcard, first = 50, after = null) {
  const queryString = `title:${titleWildcard}`;
  const json = await graphqlRequest(client, SEARCH_COLLECTIONS_BY_TITLE_QUERY, { query: queryString, first, after });
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
  }
  return json.data.collections;
}

export async function fetchAllCollectionsByTitleWildcard(client, titleWildcard) {
  const results = [];
  let after = null;
  let page = 1;

  do {
    console.log(`Fetching page ${page} for title wildcard "${titleWildcard}"...`);
    const collections = await fetchCollectionsByTitleWildcard(client, titleWildcard, 50, after);

    for (const { node } of collections.edges) {
      results.push(node);
    }

    const lastEdge = collections.edges[collections.edges.length - 1];
    after = collections.pageInfo.hasNextPage && lastEdge ? lastEdge.cursor : null;
    page += 1;
  } while (after);

  return results;
}

// Finds queried collections whose `handle` isn't already present in the
// current collections list. Appended entries keep only
// { title, handle, ruleSet } - `id` is written separately to
// resourceIdsFile.
export function findNewCollections(currentCollections, queriedCollections) {
  const existingHandles = new Set(currentCollections.map((col) => col.handle));
  return queriedCollections.filter((col) => !existingHandles.has(col.handle));
}

// Queries collections by title wildcard and appends any new ones to
// collectionsFile, merging their ids into resourceIdsFile.
export async function queryCollectionsWildcard({ client, collectionsFile, resourceIdsFile, titleWildcard }) {
  const rawData = readJsonFileIfExists(collectionsFile, []);
  const currentCollections = toCollectionList(rawData);

  const queriedCollections = await fetchAllCollectionsByTitleWildcard(client, titleWildcard);
  const newCollections = findNewCollections(currentCollections, queriedCollections);

  if (!newCollections.length) {
    console.log('No new collections to append.');
    return { added: 0 };
  }

  const newEntries = newCollections.map(({ title, handle, ruleSet }) => ({ title, handle, ruleSet }));
  const merged = currentCollections.concat(newEntries);
  const output = Array.isArray(rawData) ? merged : { ...rawData, collections: merged };

  writeJsonFile(collectionsFile, output);
  console.log(`Appended ${newEntries.length} new collection(s) to ${collectionsFile}`);

  const resourceIds = {};
  for (const { handle, id } of newCollections) {
    resourceIds[handle] = id;
  }
  saveResourceIds(resourceIdsFile, resourceIds);
  console.log(`Saved ${Object.keys(resourceIds).length} collection resource ID(s) to ${resourceIdsFile}`);

  return { added: newEntries.length };
}
