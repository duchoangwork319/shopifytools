// query-metafield-def.mjs
// Library: queries every metafield definition for a given ownerType (e.g.
// "collection", "product") from the Admin GraphQL API, paged, and writes
// them as a bare array to config/metafields/<ownerType>.json (lowercased),
// next to this script.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { writeJsonFile } from './lib/io.mjs';

const CONFIG_DIR = path.resolve(import.meta.dirname, 'config', 'metafields');

const GET_METAFIELD_DEFINITIONS_QUERY = `
  query GetMetafieldDefinitions($ownerType: MetafieldOwnerType!, $cursor: String) {
    metafieldDefinitions(first: 250, ownerType: $ownerType, after: $cursor) {
      edges {
        cursor
        node {
          id
          name
          namespace
          key
          description
          ownerType
          type {
            name
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

// Pages through every metafield definition for a given ownerType (the
// MetafieldOwnerType enum value, e.g. "COLLECTION").
export async function fetchMetafieldDefinitions(client, ownerType) {
  let cursor = null;
  let hasNextPage = true;
  const definitions = [];

  while (hasNextPage) {
    const json = await graphqlRequest(client, GET_METAFIELD_DEFINITIONS_QUERY, { ownerType, cursor });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    const connection = json.data.metafieldDefinitions;
    for (const edge of connection.edges) {
      definitions.push(edge.node);
      cursor = edge.cursor;
    }

    hasNextPage = connection.pageInfo.hasNextPage;
  }

  return definitions;
}

// Fetches every metafield definition for `ownerType` (case-insensitive,
// e.g. "collection") and writes them as a bare array to
// config/metafields/<ownerType>.json (lowercased).
export async function queryMetafieldDefinitions({ client, ownerType }) {
  const definitions = await fetchMetafieldDefinitions(client, ownerType.toUpperCase());

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const outputFile = path.resolve(CONFIG_DIR, `${ownerType.toLowerCase()}.json`);
  writeJsonFile(outputFile, definitions);
  console.log(`Saved ${definitions.length} metafield definition(s) to ${outputFile}`);

  return { count: definitions.length };
}
