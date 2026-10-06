// query-collections.mjs
// Library: queries collections from the Admin GraphQL API - all of them
// (paged), by exact handle(s), or by a title search (wildcard supported,
// e.g. "*summer*").
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { writeJsonFile } from './lib/io.mjs';

const COLLECTION_FIELDS = `
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

// Fetches collections (by `handles`, by `title` search, or all of them if
// neither is given), and writes `<sourceDir>/collections.json`
// ({ title, handle, ruleSet }[]) and
// `<sourceDir>/collection-resource-ids.json` ({ handle: id }). Both files
// are purely outputs - their existing content, if any, is not read.
export async function queryCollections({ client, sourceDir, handles, title }) {
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

  const collectionsFile = path.resolve(sourceDir, 'collections.json');
  const entries = collections.map(({ title: collectionTitle, handle, ruleSet }) => ({
    title: collectionTitle,
    handle,
    ruleSet,
  }));
  writeJsonFile(collectionsFile, entries);
  console.log(`Saved ${entries.length} collection(s) to ${collectionsFile}`);

  const resourceIdsFile = path.resolve(sourceDir, 'collection-resource-ids.json');
  const resourceIds = {};
  for (const { handle, id } of collections) {
    resourceIds[handle] = id;
  }
  writeJsonFile(resourceIdsFile, resourceIds);
  console.log(`Saved ${Object.keys(resourceIds).length} collection resource ID(s) to ${resourceIdsFile}`);

  return { count: entries.length };
}
