// system/metafield/create.mjs
// Library: creates metafield definitions against the Admin GraphQL API from
// the bare array written/updated by system/metafield/query.mjs at
// <sourceDir>/<ownerType>.json ({ id?, name, namespace, key, description,
// ownerType, type: { name } }[]). Only entries with no `id` are created -
// an entry that already has one is assumed to already exist on Shopify and
// is skipped. An entry missing `name`, `namespace`, `key`, or `type.name` is
// logged as an error and skipped, rather than sent with an invalid/missing
// field. `description` is only included in the request when the entry has
// one. On success, the
// created definition's `id` (and name/namespace/key, in case Shopify
// normalized them) is written back into that same entry, and the whole
// array is saved back to <sourceDir>/<ownerType>.json.
import path from 'path';
import { graphqlRequest } from '../../lib/api-client.mjs';
import { readJsonFile, writeJsonFile } from '../../lib/io.mjs';

const CREATE_METAFIELD_DEFINITION_MUTATION = `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        namespace
        key
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

// Builds the MetafieldDefinitionInput from a saved definition entry.
// `ownerType` is the command's own ownerType argument (uppercased) - used as
// a fallback only, since each entry already carries its own `ownerType`.
// `description` is omitted entirely (rather than sent as undefined) when the
// entry doesn't have one.
export function buildDefinitionInput(entry, ownerType) {
  return {
    name: entry.name,
    namespace: entry.namespace,
    key: entry.key,
    type: entry.type?.name,
    ...(entry.description ? { description: entry.description } : {}),
    ownerType: entry.ownerType ?? ownerType,
  };
}

export async function createMetafieldDefinition(client, definition) {
  return graphqlRequest(client, CREATE_METAFIELD_DEFINITION_MUTATION, { definition });
}

// Reads <sourceDir>/<ownerType>.json, creates every entry with no `id`
// (skipping ones that already have one), and writes the created id back
// into each entry before saving the array back to the same file.
export async function createMetafieldDefinitions({ client, sourceDir, ownerType, dryRun = false }) {
  const definitionsFile = path.resolve(sourceDir, `${ownerType.toLowerCase()}.json`);
  const definitions = readJsonFile(definitionsFile, `${ownerType} metafield definitions`);

  let hadErrors = false;
  const counts = { skipped: 0, created: 0, errors: 0 };

  for (const entry of definitions) {
    if (entry.id) {
      counts.skipped += 1;
      continue;
    }

    const missingFields = ['name', 'namespace', 'key'].filter((field) => !entry[field]);
    if (missingFields.length) {
      console.error(`Entry "${entry.namespace ?? '?'}.${entry.key ?? '?'}" is missing ${missingFields.join(', ')} - skipping.`);
      hadErrors = true;
      counts.errors += 1;
      continue;
    }

    if (!entry.type?.name) {
      console.error(`Entry "${entry.namespace}.${entry.key}" has no type.name - skipping.`);
      hadErrors = true;
      counts.errors += 1;
      continue;
    }

    const definition = buildDefinitionInput(entry, ownerType.toUpperCase());

    if (dryRun) {
      console.log(`[dry run] Would create metafield definition "${definition.namespace}.${definition.key}" with:`, JSON.stringify(definition, null, 2));
      counts.created += 1;
      continue;
    }

    console.log(`Creating metafield definition "${definition.namespace}.${definition.key}"...`);
    const result = await createMetafieldDefinition(client, definition);

    if (result.errors?.length || result.data?.metafieldDefinitionCreate?.userErrors?.length) {
      console.error(
        `Failed to create metafield definition "${definition.namespace}.${definition.key}":`,
        result.errors ?? result.data.metafieldDefinitionCreate.userErrors,
      );
      hadErrors = true;
      counts.errors += 1;
      continue;
    }

    const created = result.data.metafieldDefinitionCreate.createdDefinition;
    entry.id = created.id;
    entry.name = created.name;
    entry.namespace = created.namespace;
    entry.key = created.key;
    writeJsonFile(definitionsFile, definitions);
    counts.created += 1;
  }

  console.log(`\nSkipped: ${counts.skipped}, Created: ${counts.created}, Errors: ${counts.errors}`);

  return { hadErrors };
}
