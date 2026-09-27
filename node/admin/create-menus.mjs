// create-menus.mjs
// Library: creates menu(s) against the Admin GraphQL API from a JSON input
// file. The file may hold either a single menuCreate input
// ({ title, handle, items }) or a batch of them
// ({ menuCreateInputs: [{ title, handle, items }, ...] }); each menu runs
// through the CreateCollectionMenu mutation against the Admin GraphQL API.
//
// This runs after create-collections.mjs. Collection-linked items are
// authored with a `url` (e.g. "/collections/womens-featured-shop-all-women")
// rather than a hardcoded `resourceId`, since the real resourceId only
// exists once the collection has been created. Before sending each menu,
// `/collections/<handle>` urls are resolved to `resourceId` via
// resourceIdsFile (written by create-collections.mjs), read from the same
// directory as the menu file.
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFile, readJsonFileIfExists } from './lib/io.mjs';

const CREATE_COLLECTION_MENU_MUTATION = `
  mutation CreateCollectionMenu(
    $title: String!
    $handle: String!
    $items: [MenuItemCreateInput!]!
  ) {
    menuCreate(title: $title, handle: $handle, items: $items) {
      menu {
        id
        handle
        items {
          id
          title
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Resolves a "/collections/<handle>" item url to its real resourceId using
// the { handle: id } map from resourceIdsFile. Items that aren't collection
// links, or whose handle isn't in the map yet, are left untouched.
export function resolveItemResourceId(item, collectionResourceIds) {
  if (item.resourceId || !item.url) return item;

  const match = item.url.match(/^\/collections\/([^/?#]+)/);
  if (!match) return item;

  const handle = match[1];
  const resourceId = collectionResourceIds[handle];
  if (!resourceId) {
    console.warn(`No collection resource ID found for handle "${handle}" (menu item "${item.title}")`);
    return item;
  }

  const { url, ...rest } = item;
  return { ...rest, resourceId };
}

export function resolveMenuResourceIds(variables, collectionResourceIds) {
  return {
    ...variables,
    items: variables.items.map((item) => resolveItemResourceId(item, collectionResourceIds)),
  };
}

export async function createCollectionMenu(client, variables) {
  return graphqlRequest(client, CREATE_COLLECTION_MENU_MUTATION, variables);
}

// Reads menu input(s) from menuInputFile and creates them, resolving
// collection-linked items via resourceIdsFile if it exists.
export async function createMenus({ client, menuInputFile, resourceIdsFile }) {
  const menuInputs = readJsonFile(menuInputFile, 'menu variables');
  const collectionResourceIds = readJsonFileIfExists(resourceIdsFile, {});

  let hadErrors = false;

  for (const menuInput of menuInputs) {
    const variables = resolveMenuResourceIds(menuInput, collectionResourceIds);
    console.log(`\nCreating menu "${variables.title}" (${variables.handle})...`);
    const result = await createCollectionMenu(client, variables);
    console.log(JSON.stringify(result, null, 2));

    if (result.errors?.length || result.data?.menuCreate?.userErrors?.length) {
      hadErrors = true;
    }
  }

  return { hadErrors };
}
