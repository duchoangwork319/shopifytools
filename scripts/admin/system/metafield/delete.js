// system/metafield/delete.js
// Library: deletes metafield definitions - by comma-separated key(s), or by
// every definition under a given `namespace` - for a given ownerType, from
// the Admin GraphQL API (metafieldDefinitionDelete, which also deletes every
// metafield value already set from that definition on Shopify). That API
// call always happens for a matched definition that has an `id` (unless
// `local: true`), because editing a metafield's `namespace`/`key`/`type`
// requires deleting it and re-creating it - this command is also the tool
// for that "soft reset": by default (`rmDefs: false`) it only clears the
// matched entries' `id` in <sourceDir>/<ownerType>.json, leaving the rest of
// the entry (including any namespace/key/type edits made since) in place so
// `system metafield create` can re-create it. With `rmDefs: true`, the
// matched entries are removed from that file entirely instead. Either way,
// the matching metafield values are also removed from every per-object JSON
// file in that ownerType's own business folder, since those values no
// longer exist once the definition is deleted. `product` and
// `productvariant` share the same <mainDir>/product/<handle>.json files - a
// "product" field lives on the product's own `metafields`, a
// "productvariant" field lives on each `variants[i].metafields`. With
// `local: true`, the GraphQL API is never called - only the local files are
// updated, as if the remote deletion had already happened.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from '../../lib/api-client.js';
import { readJsonFile, writeJsonFile } from '../../lib/io.js';
import { FOLDER } from '../../lib/constants.js';

const DELETE_METAFIELD_DEFINITION_MUTATION = `
  mutation DeleteMetafieldDefinition($id: ID!, $deleteAllAssociatedMetafields: Boolean!) {
    metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: $deleteAllAssociatedMetafields) {
      deletedDefinitionId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

// The business folder holding the per-object JSON files whose `metafields`
// could reference a definition of this ownerType. `product` and
// `productvariant` share the same folder/files - a product's own fields vs.
// its variants' fields are just different properties of the same file.
const OWNER_TYPE_DATA_FOLDER = {
  COLLECTION: FOLDER.COLLECTION,
  PRODUCT: FOLDER.PRODUCT,
  PRODUCTVARIANT: FOLDER.PRODUCT,
};

export async function deleteMetafieldDefinition(client, id, deleteAllAssociatedMetafields = true) {
  return graphqlRequest(client, DELETE_METAFIELD_DEFINITION_MUTATION, { id, deleteAllAssociatedMetafields });
}

function stripByKey(metafields, keys) {
  if (!Array.isArray(metafields)) return null;
  const filtered = metafields.filter((metafield) => !keys.has(metafield.key));
  return filtered.length === metafields.length ? null : filtered;
}

// Removes every metafield entry whose key is in `keys` from a single
// business-object JSON entry, scoped to where `ownerType`'s fields actually
// live on that object. Mutates `entry` in place; returns whether anything changed.
function removeMetafieldsFromEntry(entry, ownerType, keys) {
  let changed = false;

  if (ownerType === 'PRODUCTVARIANT') {
    for (const variant of entry.variants ?? []) {
      const filtered = stripByKey(variant.metafields, keys);
      if (filtered) {
        variant.metafields = filtered;
        changed = true;
      }
    }
  } else {
    const filtered = stripByKey(entry.metafields, keys);
    if (filtered) {
      entry.metafields = filtered;
      changed = true;
    }
  }

  return changed;
}

// Removes every metafield entry matching `keys` from every
// `<dataDir>/<handle>.json` file (skipping "_"-prefixed files like
// FILE.RESOURCE_IDS/FILE.SEARCHABLE_ATTRS, which aren't per-object data),
// saving changed files back to disk. Returns the number of files updated.
function removeMetafieldsFromDataFiles(dataDir, ownerType, keys) {
  if (!fs.existsSync(dataDir)) return 0;

  const dataFiles = fs.readdirSync(dataDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('_'));

  let updatedFiles = 0;
  for (const dataFile of dataFiles) {
    const filePath = path.join(dataDir, dataFile.name);
    const data = readJsonFile(filePath, dataFile.name);
    if (removeMetafieldsFromEntry(data, ownerType, keys)) {
      writeJsonFile(filePath, data);
      updatedFiles += 1;
    }
  }

  return updatedFiles;
}

// Resolves which definitions a delete call targets: either the given `fields`
// (keys, every one must match a saved definition - unmatched ones are warned
// about), or, when `fields` is empty, every definition under `namespace`
// (warned about if none match). Exactly one of the two is expected to be
// set by the caller.
function resolveMatchedDefinitions(definitions, definitionsFile, { fields, namespace }) {
  if (namespace) {
    const matched = definitions.filter((entry) => entry.namespace === namespace);
    if (!matched.length) {
      console.warn(`No metafield definitions found under namespace "${namespace}" in ${definitionsFile}.`);
    }
    return { matched, hadErrors: false };
  }

  const requestedKeys = new Set(fields);
  const matched = definitions.filter((entry) => requestedKeys.has(entry.key));
  const notFoundKeys = [...requestedKeys].filter((key) => !matched.some((entry) => entry.key === key));
  for (const key of notFoundKeys) {
    console.warn(`No metafield definition found for key "${key}" in ${definitionsFile} - skipping.`);
  }

  return { matched, hadErrors: notFoundKeys.length > 0 };
}

// Deletes metafield definitions matching `fields` (keys), or every
// definition under `namespace` when `fields` is empty, for `ownerType`, from
// <sourceDir>/<ownerType>.json. For each matched definition that has an
// `id`, metafieldDefinitionDelete is called first (unless `local: true`),
// which also deletes every metafield value already set from it on Shopify -
// a definition with no `id` was never created remotely, so there's nothing
// to call. Only once that (or the `local`/no-`id` skip) succeeds is the
// local file updated: with `rmDefs: true`, the matched entry is removed
// entirely from <sourceDir>/<ownerType>.json; otherwise (the default) only
// its `id` is cleared, leaving namespace/key/type/etc. in place so they can
// be edited and re-created via `system metafield create`. Either way, the
// matching metafield value(s) are also removed from every per-object JSON
// file in <mainDir>/<ownerType's business folder>, since those values no
// longer exist once the definition is deleted. With `dryRun: true`, nothing
// is actually deleted or written - the API is never called and no file is
// modified; only what would happen is logged.
export async function deleteMetafieldDefinitions({ client, sourceDir, mainDir, ownerType, fields = [], namespace, local = false, dryRun = false, rmDefs = false }) {
  const normalizedOwnerType = ownerType.toUpperCase();
  const definitionsFile = path.resolve(sourceDir, `${ownerType.toLowerCase()}.json`);
  const definitions = readJsonFile(definitionsFile, `${ownerType} metafield definitions`);

  const { matched, hadErrors: matchErrors } = resolveMatchedDefinitions(definitions, definitionsFile, { fields, namespace });

  let hadErrors = matchErrors;
  const processedKeys = [];

  for (const definition of matched) {
    if (dryRun) {
      const apiScope = local ? 'locally only (no API call)' : 'on Shopify (including every associated metafield value) and locally';
      const localAction = rmDefs
        ? `removing the definition entry entirely from ${definitionsFile}`
        : 'clearing its "id" so it can be edited and re-created via "system metafield create"';
      console.log(`[dry run] Would delete metafield definition "${definition.namespace}.${definition.key}" ${apiScope}, then ${localAction}.`);
      processedKeys.push(definition.key);
      continue;
    }

    if (local) {
      console.log(`[local] Updating "${definition.namespace}.${definition.key}" in local data only.`);
      processedKeys.push(definition.key);
      continue;
    }

    if (!definition.id) {
      console.warn(`Definition "${definition.namespace}.${definition.key}" has no "id" (never created on Shopify) - updating locally only.`);
      processedKeys.push(definition.key);
      continue;
    }

    console.log(`Deleting metafield definition "${definition.namespace}.${definition.key}"...`);
    const result = await deleteMetafieldDefinition(client, definition.id);

    if (result.errors?.length || result.data?.metafieldDefinitionDelete?.userErrors?.length) {
      console.error(
        `Failed to delete metafield definition "${definition.namespace}.${definition.key}":`,
        result.errors ?? result.data.metafieldDefinitionDelete.userErrors,
      );
      hadErrors = true;
      continue;
    }

    processedKeys.push(definition.key);
  }

  if (!processedKeys.length) {
    console.log('\nNo metafield definitions were changed.');
    return { hadErrors, processedKeys };
  }

  const dataFolder = OWNER_TYPE_DATA_FOLDER[normalizedOwnerType];

  if (dryRun) {
    const action = rmDefs ? `remove ${processedKeys.length} definition(s) from` : `clear "id" from ${processedKeys.length} definition(s) in`;
    console.log(`\n[dry run] Would ${action} ${definitionsFile}.`);
    if (dataFolder) {
      console.log(`[dry run] Would remove matching metafield(s) from per-object JSON files in ${path.join(mainDir, dataFolder)}.`);
    }
    return { hadErrors, processedKeys };
  }

  const processedKeySet = new Set(processedKeys);

  if (rmDefs) {
    const remainingDefinitions = definitions.filter((entry) => !processedKeySet.has(entry.key));
    writeJsonFile(definitionsFile, remainingDefinitions);
    console.log(`Removed ${processedKeys.length} definition(s) from ${definitionsFile}.`);
  } else {
    let clearedCount = 0;
    const updatedDefinitions = definitions.map((entry) => {
      if (!processedKeySet.has(entry.key) || entry.id === undefined) return entry;
      clearedCount += 1;
      const { id, ...rest } = entry;
      return rest;
    });
    writeJsonFile(definitionsFile, updatedDefinitions);
    console.log(
      `Cleared "id" from ${clearedCount} definition(s) in ${definitionsFile} - edit namespace/key/type as needed, ` +
      'then run "system metafield create" to re-create them.',
    );
  }

  if (dataFolder) {
    const dataDir = path.join(mainDir, dataFolder);
    const updatedFiles = removeMetafieldsFromDataFiles(dataDir, normalizedOwnerType, processedKeySet);
    console.log(`Removed matching metafield(s) from ${updatedFiles} file(s) in ${dataDir}.`);
  } else {
    console.warn(`No known local data folder for ownerType "${ownerType}" - skipped cleaning per-object metafields.`);
  }

  return { hadErrors, processedKeys };
}
