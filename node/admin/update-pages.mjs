import fetch from 'node-fetch';

const SHOP = 'your-store.myshopify.com';
const ACCESS_TOKEN = 'YOUR_ADMIN_API_ACCESS_TOKEN';
const API_VERSION = '2026-04';
const GRAPHQL_URL = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

const UPDATE_PAGE_MUTATION = `
  mutation UpdatePageById($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// pageIdHere is the page's GID (e.g. "gid://shopify/Page/1234567890")
// which corresponds to the handle you care about.
async function updatePageById(pageIdHere, { title, body }) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: UPDATE_PAGE_MUTATION,
      variables: {
        id: pageIdHere,
        page: {
          ...(title ? { title } : {}),
          ...(body ? { body } : {}),
        },
      },
    }),
  });

  const json = await response.json();
  if (!response.ok || json.errors) {
    console.error('Request failed:', JSON.stringify(json, null, 2));
    throw new Error('GraphQL request failed');
  }

  const result = json.data.pageUpdate;
  if (result.userErrors && result.userErrors.length) {
    console.error('User errors:', result.userErrors);
    throw new Error('Failed to update page');
  }

  return result.page;
}

// Example usage (you provide the ID for the handle you care about)
(async () => {
  try {
    const pageIdForHandle = 'gid://shopify/Page/1234567890'; // from your own mapping
    const updated = await updatePageById(pageIdForHandle, {
      title: 'New title',
      body: '<p>New body HTML</p>',
    });
    console.log('Updated page:', updated);
  } catch (e) {
    console.error(e);
  }
})();