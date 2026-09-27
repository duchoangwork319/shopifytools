// query-collections.mjs
// Library: lists "smart" collections (those with a non-null ruleSet) from
// the Admin GraphQL API, paging through all collections.
import { graphqlRequest } from './lib/api-client.mjs';

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

export async function fetchCollectionsPage(client, first = 50, after = null) {
  const json = await graphqlRequest(client, LIST_COLLECTIONS_WITH_RULES_QUERY, { first, after });
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
  }
  return json.data.collections;
}

// Pages through all collections and returns only those with a non-null
// ruleSet ("smart" collections).
export async function listSmartCollections({ client }) {
  const smartCollections = [];
  let after = null;
  let page = 1;

  do {
    console.log(`Fetching page ${page}...`);
    const collections = await fetchCollectionsPage(client, 50, after);

    collections.edges
      .filter(({ node }) => node.ruleSet !== null)
      .forEach(({ node }) => {
        console.log('--------------------------');
        console.log(`ID:     ${node.id}`);
        console.log(`Handle: ${node.handle}`);
        console.log(`Title:  ${node.title}`);
        console.log('Rule set:');
        console.dir(node.ruleSet, { depth: null });
        smartCollections.push(node);
      });

    const lastEdge = collections.edges[collections.edges.length - 1];
    after = collections.pageInfo.hasNextPage && lastEdge ? lastEdge.cursor : null;
    page += 1;
  } while (after);

  return smartCollections;
}
