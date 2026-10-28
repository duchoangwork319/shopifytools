// query-menus.mjs
// Library: queries menus from the Admin GraphQL API (all of them, paged;
// the `menus` connection has no server-side handle/title filter) and writes
// <sourceDir>/menus.json, keyed down to the handles requested.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { writeJsonFile } from './lib/io.mjs';

const MENU_ITEM_FIELDS = `
  id
  title
  type
  url
  resourceId
`;

const GET_ALL_MENUS_QUERY = `
  query GetAllMenus($cursor: String) {
    menus(first: 100, after: $cursor) {
      edges {
        cursor
        node {
          id
          handle
          title
          isDefault
          items {
            ${MENU_ITEM_FIELDS}
            items {
              ${MENU_ITEM_FIELDS}
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

// Pages through every menu.
export async function fetchAllMenus(client) {
  let cursor = null;
  let hasNextPage = true;
  const allMenus = [];

  while (hasNextPage) {
    const json = await graphqlRequest(client, GET_ALL_MENUS_QUERY, { cursor });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    const connection = json.data.menus;
    for (const edge of connection.edges) {
      allMenus.push(edge.node);
      cursor = edge.cursor;
    }

    hasNextPage = connection.pageInfo.hasNextPage;
  }

  return allMenus;
}

// Fetches menus (by `handles`, or all of them if omitted/empty), and writes
// `<sourceDir>/menus.json` ({ id, handle, title, isDefault, items }[]). The
// file is purely an output - its existing content, if any, is not read.
export async function queryMenus({ client, sourceDir, handles }) {
  fs.mkdirSync(sourceDir, { recursive: true });

  const allMenus = await fetchAllMenus(client);

  let menus;
  if (handles?.length) {
    const byHandle = new Map(allMenus.map((menu) => [menu.handle, menu]));
    menus = [];
    for (const handle of handles) {
      const menu = byHandle.get(handle);
      if (!menu) {
        console.warn(`No menu found for handle "${handle}" - skipping.`);
        continue;
      }
      menus.push(menu);
    }
  } else {
    menus = allMenus;
  }

  const menusFile = path.resolve(sourceDir, 'menus.json');
  writeJsonFile(menusFile, menus);
  console.log(`Saved ${menus.length} menu(s) to ${menusFile}`);

  return { count: menus.length };
}
