#!/usr/bin/env node
// index.mjs
// CLI entry point wiring the admin library scripts (create/update/query
// collections, create menus) into a single `commander`-based tool with
// `collection`, `menu`, and `page` sub-commands, each nesting `create`,
// `update`, `query`.
import { Command } from 'commander';
import path from 'path';
import { createAdminApiClient, loadEnv, readAuth } from './lib/api-client.mjs';
import { resourceIdsFileFor } from './lib/io.mjs';
import { createCollections, DEFAULT_CHUNK_SIZE as CREATE_CHUNK_SIZE, DEFAULT_DELAY_MS as CREATE_DELAY_MS } from './create-collections.mjs';
import { updateCollections, DEFAULT_CHUNK_SIZE as UPDATE_CHUNK_SIZE, DEFAULT_DELAY_MS as UPDATE_DELAY_MS } from './update-collections.mjs';
import { listSmartCollections } from './query-collections.mjs';
import { queryCollectionsWildcard } from './query-collections-wildcard.mjs';
import { createMenus } from './create-menus.mjs';
import { queryPages } from './query-pages.mjs';

loadEnv();

const DEFAULT_AUTH_FILE = path.resolve(import.meta.dirname, 'data', 'access-token.json');

function withAuthOption(command) {
  return command.option('-a, --auth <file>', 'path to access-token.json', DEFAULT_AUTH_FILE);
}

// Builds an Admin API client from the -a/--auth option, resolving the path
// with path.resolve (never path.isAbsolute / path.join(dirname, ...)).
function clientFromOpts(opts) {
  const authFile = path.resolve(opts.auth);
  const { shop, accessToken } = readAuth(authFile);
  return createAdminApiClient({ shop, accessToken });
}

function exitOnErrors({ hadErrors }) {
  if (hadErrors) process.exitCode = 1;
}

const program = new Command();
program.name('admin').description('Shopify admin data CLI (collections, menus, pages)');

// ---------------------------------------------------------------------------
// collection
// ---------------------------------------------------------------------------
const collection = program.command('collection').description('manage collections');

withAuthOption(
  collection
    .command('create <file>')
    .description('create collections from a CollectionCreateInput JSON file')
    .option('--chunk-size <n>', 'collections per GraphQL request', String(CREATE_CHUNK_SIZE))
    .option('--delay-ms <n>', 'delay between chunk requests, in ms', String(CREATE_DELAY_MS)),
).action(async (file, opts) => {
  const client = clientFromOpts(opts);
  const collectionsFile = path.resolve(file);
  const resourceIdsFile = resourceIdsFileFor(collectionsFile);
  const result = await createCollections({
    client,
    collectionsFile,
    resourceIdsFile,
    chunkSize: Number(opts.chunkSize),
    delayMs: Number(opts.delayMs),
  });
  exitOnErrors(result);
});

withAuthOption(
  collection
    .command('update <file>')
    .description('update collections from a CollectionInput JSON file (keyed by handle)')
    .option('--chunk-size <n>', 'collections per GraphQL request', String(UPDATE_CHUNK_SIZE))
    .option('--delay-ms <n>', 'delay between chunk requests, in ms', String(UPDATE_DELAY_MS)),
).action(async (file, opts) => {
  const client = clientFromOpts(opts);
  const collectionsFile = path.resolve(file);
  const resourceIdsFile = resourceIdsFileFor(collectionsFile);
  const result = await updateCollections({
    client,
    collectionsFile,
    resourceIdsFile,
    chunkSize: Number(opts.chunkSize),
    delayMs: Number(opts.delayMs),
  });
  exitOnErrors(result);
});

withAuthOption(
  collection
    .command('query <file> [titleWildcard]')
    .description(
      'without titleWildcard: list all smart collections (with a ruleSet). ' +
      'with titleWildcard (e.g. "*summer*"): search by title and append new collections to <file>',
    ),
).action(async (file, titleWildcard, opts) => {
  const client = clientFromOpts(opts);
  if (!titleWildcard) {
    await listSmartCollections({ client });
    return;
  }
  const collectionsFile = path.resolve(file);
  const resourceIdsFile = resourceIdsFileFor(collectionsFile);
  await queryCollectionsWildcard({ client, collectionsFile, resourceIdsFile, titleWildcard });
});

// ---------------------------------------------------------------------------
// menu
// ---------------------------------------------------------------------------
const menu = program.command('menu').description('manage navigation menus');

withAuthOption(
  menu
    .command('create <file>')
    .description('create menu(s) from a menuCreate input JSON file'),
).action(async (file, opts) => {
  const client = clientFromOpts(opts);
  const menuInputFile = path.resolve(file);
  const resourceIdsFile = resourceIdsFileFor(menuInputFile);
  const result = await createMenus({ client, menuInputFile, resourceIdsFile });
  exitOnErrors(result);
});

withAuthOption(menu.command('update <file>').description('not implemented yet')).action(() => {
  console.log('menu update: not implemented yet');
});

withAuthOption(menu.command('query [file]').description('not implemented yet')).action(() => {
  console.log('menu query: not implemented yet');
});

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
const page = program.command('page').description('manage pages');

withAuthOption(page.command('create <file>').description('not implemented yet')).action(() => {
  console.log('page create: not implemented yet');
});

withAuthOption(page.command('update <file>').description('not implemented yet')).action(() => {
  console.log('page update: not implemented yet');
});

withAuthOption(
  page
    .command('query <file> [handles]')
    .description(
      'fetch page(s) by comma-separated handles (or all pages if omitted), ' +
      'writing each body to <handle>.html next to <file> and the entries to <file>',
    ),
).action(async (file, handles, opts) => {
  const client = clientFromOpts(opts);
  const pagesFile = path.resolve(file);
  const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
  await queryPages({ client, pagesFile, handles: handleList });
});

program.parseAsync(process.argv);
