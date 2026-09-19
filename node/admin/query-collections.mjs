// list-smart-collections-with-rules.js
import fetch from 'node-fetch';
import 'dotenv/config';

const SHOP = process.env.SHOPIFY_SHOP;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const LIST_COLLECTIONS_WITH_RULES_QUERY = `
  query ListCollectionsWithRules($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
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

async function fetchCollectionsPage(first = 50, after = null) {
  const endpoint = `https://${SHOP}/admin/api/2026-04/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query: LIST_COLLECTIONS_WITH_RULES_QUERY,
      variables: { first, after },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const json = await response.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
  }
  return json.data.collections;
}

async function run() {
  let after = null;
  let page = 1;

  do {
    console.log(`Fetching page ${page}...`);
    const collections = await fetchCollectionsPage(50, after);

    // “Smart” collections = those with a non-null ruleSet
    collections.edges
      .filter(({ node }) => node.ruleSet !== null)
      .forEach(({ node }) => {
        console.log('--------------------------');
        console.log(`ID:     ${node.id}`);
        console.log(`Handle: ${node.handle}`);
        console.log(`Title:  ${node.title}`);
        console.log('Rule set:');
        console.dir(node.ruleSet, { depth: null });
      });

    const lastEdge = collections.edges[collections.edges.length - 1];
    after = collections.pageInfo.hasNextPage && lastEdge ? lastEdge.cursor : null;
    page += 1;
  } while (after);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});