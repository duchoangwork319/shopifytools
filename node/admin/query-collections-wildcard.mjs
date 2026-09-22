// query-collections-wildcard.mjs
// Reads the access token saved by auth.mjs, queries collections by title
// (wildcard supported, e.g. "*summer*"), and appends any collections not
// already present in a current collections input JSON file.
// Usage: `node query-collections-wildcard.mjs <current-collections-file> <title-wildcard>`
// e.g. `node query-collections-wildcard.mjs mens-collections-20260913.json "*summer*"`
// The current collections file may hold either a bare array of collection
// objects (matched here by `handle`) or { collections: [...] } - same shapes
// accepted/produced by create-collections.mjs. Newly found collections are
// appended as { id, title, handle, ruleSet }.
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

const tokenFile = path.join(__dirname, 'data', 'access-token.json');
const collectionsInputArg = process.argv[2];
const titleArg = process.argv[3];

if (!collectionsInputArg || !titleArg) {
  console.error('Usage: node query-collections-wildcard.mjs <current-collections-file> <title-wildcard>');
  process.exit(1);
}

const collectionsFile = path.isAbsolute(collectionsInputArg)
  ? collectionsInputArg
  : path.join(__dirname, 'data', collectionsInputArg);
const resourceIdsFile = path.join(path.dirname(collectionsFile), 'collection-resource-ids.json');

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

function readJsonFile(file, label) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label} file: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Accepts either a bare array of collection objects, or { collections: [...] }.
function toCollectionList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.collections)) {
    return data.collections;
  }
  return [data];
}

async function fetchCollectionsByTitleWildcard(shop, accessToken, titleWildcard, first = 50, after = null) {
  const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`;
  const queryString = `title:${titleWildcard}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: SEARCH_COLLECTIONS_BY_TITLE_QUERY,
      variables: { query: queryString, first, after },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GraphQL HTTP error ${response.status}: ${text}`);
  }

  const json = await response.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
  }
  return json.data.collections;
}

async function fetchAllCollectionsByTitleWildcard(shop, accessToken, titleWildcard) {
  const results = [];
  let after = null;
  let page = 1;

  do {
    console.log(`Fetching page ${page} for title wildcard "${titleWildcard}"...`);
    const collections = await fetchCollectionsByTitleWildcard(shop, accessToken, titleWildcard, 50, after);

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
// collection-resource-ids.json.
function findNewCollections(currentCollections, queriedCollections) {
  const existingHandles = new Set(currentCollections.map((col) => col.handle));
  return queriedCollections.filter((col) => !existingHandles.has(col.handle));
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
  if (!shop || !accessToken) {
    console.error(`${tokenFile} is missing "shop" or "access_token". Run auth.mjs first.`);
    process.exit(1);
  }

  const rawData = fs.existsSync(collectionsFile) ? readJsonFile(collectionsFile, 'collections') : [];
  const currentCollections = toCollectionList(rawData);

  const queriedCollections = await fetchAllCollectionsByTitleWildcard(shop, accessToken, titleArg);
  const newCollections = findNewCollections(currentCollections, queriedCollections);

  if (!newCollections.length) {
    console.log('No new collections to append.');
    return;
  }

  const newEntries = newCollections.map(({ title, handle, ruleSet }) => ({ title, handle, ruleSet }));
  const merged = currentCollections.concat(newEntries);
  const output = Array.isArray(rawData) ? merged : { ...rawData, collections: merged };

  fs.mkdirSync(path.dirname(collectionsFile), { recursive: true });
  fs.writeFileSync(collectionsFile, JSON.stringify(output, null, 2));
  console.log(`Appended ${newEntries.length} new collection(s) to ${collectionsFile}`);

  const resourceIds = {};
  for (const { handle, id } of newCollections) {
    resourceIds[handle] = id;
  }
  saveResourceIds(resourceIdsFile, resourceIds);
  console.log(`Saved ${Object.keys(resourceIds).length} collection resource ID(s) to ${resourceIdsFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
