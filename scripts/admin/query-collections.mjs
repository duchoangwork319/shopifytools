// query-collections.mjs
// Library: queries collections from the Admin GraphQL API - all of them
// (paged), by exact handle(s), or by a title search (wildcard supported,
// e.g. "*summer*"). Each collection's metafields are fetched (paged) and
// attached as a `metafields` property.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { writeJsonFile } from './lib/io.mjs';

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
      metafields.push(edge.node);
      cursor = edge.cursor;
    }

    hasNextPage = connection.pageInfo.hasNextPage;
  }

  return metafields;
}

// Attaches each collection's metafields as a `metafields` property.
// Requests run sequentially (one collection at a time) to avoid a large
// burst of API requests.
async function withMetafields(client, collections) {
  const enriched = [];
  for (const collection of collections) {
    console.log(`Fetching metafields for "${collection.handle}"...`);
    const metafields = await fetchCollectionMetafields(client, collection.id);
    enriched.push({ ...collection, metafields });
  }
  return enriched;
}

// Fetches collections (by `handles`, by `title` search, or all of them if
// neither is given), attaches each one's metafields, and writes
// `<sourceDir>/collections.json`
// ({ title, handle, description, descriptionHtml, templateSuffix, seo,
// ruleSet, metafields }[]) and `<sourceDir>/collection-resource-ids.json`
// ({ handle: id }). Both files are purely outputs - their existing content,
// if any, is not read.
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

  collections = await withMetafields(client, collections);

  const collectionsFile = path.resolve(sourceDir, 'collections.json');
  const entries = collections.map(({
    title: collectionTitle,
    handle,
    description,
    descriptionHtml,
    templateSuffix,
    seo,
    ruleSet,
    metafields,
  }) => ({
    title: collectionTitle,
    handle,
    description,
    descriptionHtml,
    templateSuffix,
    seo,
    ruleSet,
    metafields,
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
