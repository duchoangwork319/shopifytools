// update-menus.mjs
// Library: updates menu(s) against the Admin GraphQL API, sourced from
// <sourceDir>/menus.json (the shape written by query-menus.mjs: an array of
// { id, handle, title, items }). Menus can be narrowed down to a
// comma-separated list of handles; with none given, every entry in the file
// is updated.
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFile } from './lib/io.mjs';

const UPDATE_MENU_MUTATION = `
  mutation UpdateMenu(
    $id: ID!
    $title: String!
    $handle: String!
    $items: [MenuItemUpdateInput!]!
  ) {
    menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
      menu {
        id
        handle
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Map a MenuItem tree (as read from menus.json) into MenuItemUpdateInput[].
export function mapItemsToUpdateInput(items) {
  return (items || []).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    url: item.url,
    resourceId: item.resourceId,
    items: mapItemsToUpdateInput(item.items),
  }));
}

export async function updateMenuById(client, id, { title, handle, items }) {
  return graphqlRequest(client, UPDATE_MENU_MUTATION, {
    id,
    title,
    handle,
    items: mapItemsToUpdateInput(items),
  });
}

// Narrows menus.json entries down to `handles` (every entry must exist). With
// no handles given, every entry is selected.
export function selectMenus(menus, handles) {
  if (!handles?.length) return menus;

  const byHandle = new Map(menus.map((menu) => [menu.handle, menu]));
  const selected = [];
  for (const handle of handles) {
    const menu = byHandle.get(handle);
    if (!menu) {
      console.error(`Handle "${handle}" not found in menus.json.`);
      process.exit(1);
    }
    selected.push(menu);
  }
  return selected;
}

// Reads `<sourceDir>/menus.json` (exits if missing), narrows it down via
// `handles`, and pushes each selected entry's title/handle/items back to
// Shopify via menuUpdate.
export async function updateMenus({ client, sourceDir, handles, dryRun = false }) {
  const menusFile = path.resolve(sourceDir, 'menus.json');
  const menus = readJsonFile(menusFile, 'menus');
  const entries = selectMenus(menus, handles);

  let updated = 0;
  let failed = 0;

  for (const entry of entries) {
    if (dryRun) {
      console.log(`[dry run] Would update menu "${entry.title}" (${entry.handle}).`);
      updated += 1;
      continue;
    }

    console.log(`Updating menu "${entry.title}" (${entry.handle})...`);
    const result = await updateMenuById(client, entry.id, entry);
    const menuResult = result.data?.menuUpdate;

    if (result.errors?.length || menuResult?.userErrors?.length) {
      console.error(`Failed to update menu "${entry.handle}":`, result.errors ?? menuResult.userErrors);
      failed += 1;
      continue;
    }

    console.log('Updated menu:', menuResult.menu);
    updated += 1;
  }

  console.log(`Update complete. ${updated} succeeded, ${failed} failed.`);

  return { updated, failed };
}
