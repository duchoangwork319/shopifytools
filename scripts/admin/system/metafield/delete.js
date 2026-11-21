// system/metafield/delete.js
// Library: deletes metafield definitions - by comma-separated key(s), for a
// given ownerType - from the Admin GraphQL API (metafieldDefinitionDelete,
// which also deletes every metafield value already set from that
// definition), then removes the matching entries from
// <sourceDir>/<ownerType>.json (the file written by "system metafield
// query"/"create") and from every per-object JSON file in that ownerType's
// own business folder. `product` and `productvariant` share the same
// <mainDir>/product/<handle>.json files - a "product" field lives on the
// product's own `metafields`, a "productvariant" field lives on each
// `variants[i].metafields`. With `local: true`, the GraphQL API is never
// called - only the local files are cleaned up.
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

// Deletes metafield definitions matching `fields` (keys) for `ownerType`,
// from <sourceDir>/<ownerType>.json. With `local: true`, skips the GraphQL
// API entirely and only removes the matching entries locally - from the
// definitions file and from every per-object JSON file that could carry one
// of those fields' metafields (<mainDir>/<ownerType's business folder>).
// Otherwise, each definition is deleted via metafieldDefinitionDelete first
// (which also deletes every metafield value already set from it on
// Shopify) - only successfully deleted ones are then removed locally.
export async function deleteMetafieldDefinitions({ client, sourceDir, mainDir, ownerType, fields, local = false }) {
  const normalizedOwnerType = ownerType.toUpperCase();
  const definitionsFile = path.resolve(sourceDir, `${ownerType.toLowerCase()}.json`);
  const definitions = readJsonFile(definitionsFile, `${ownerType} metafield definitions`);

  const requestedKeys = new Set(fields);
  const matched = definitions.filter((entry) => requestedKeys.has(entry.key));
  const notFoundKeys = [...requestedKeys].filter((key) => !matched.some((entry) => entry.key === key));
  for (const key of notFoundKeys) {
    console.warn(`No metafield definition found for key "${key}" in ${definitionsFile} - skipping.`);
  }

  let hadErrors = notFoundKeys.length > 0;
  const deletedKeys = [];

  for (const definition of matched) {
    if (local) {
      console.log(`[local] Removing "${definition.namespace}.${definition.key}" from local data only.`);
      deletedKeys.push(definition.key);
      continue;
    }

    if (!definition.id) {
      console.warn(`Definition "${definition.namespace}.${definition.key}" has no "id" (never created on Shopify) - removing locally only.`);
      deletedKeys.push(definition.key);
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

    deletedKeys.push(definition.key);
  }

  if (!deletedKeys.length) {
    console.log('\nNo metafield definitions were deleted.');
    return { hadErrors, deletedKeys };
  }

  const deletedKeySet = new Set(deletedKeys);
  const remainingDefinitions = definitions.filter((entry) => !deletedKeySet.has(entry.key));
  writeJsonFile(definitionsFile, remainingDefinitions);
  console.log(`Removed ${deletedKeys.length} definition(s) from ${definitionsFile}.`);

  const dataFolder = OWNER_TYPE_DATA_FOLDER[normalizedOwnerType];
  if (dataFolder) {
    const dataDir = path.join(mainDir, dataFolder);
    const updatedFiles = removeMetafieldsFromDataFiles(dataDir, normalizedOwnerType, deletedKeySet);
    console.log(`Removed matching metafield(s) from ${updatedFiles} file(s) in ${dataDir}.`);
  } else {
    console.warn(`No known local data folder for ownerType "${ownerType}" - skipped cleaning per-object metafields.`);
  }

  return { hadErrors, deletedKeys };
}
