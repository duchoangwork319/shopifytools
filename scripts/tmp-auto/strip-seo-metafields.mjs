#!/usr/bin/env node
// strip-seo-metafields.mjs
// One-off cleanup (not part of the admin CLI architecture): scans every
// `<source>/<handle>.json` collection file (the shape written by
// query-collections.mjs) and removes any `title_tag`/`description_tag`
// entries from its `metafields` array - Shopify's own SEO pseudo-metafields
// (the same values as `seo.title`/`seo.description`), which query-collections
// no longer saves going forward, but older collection files may still have.
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

const STRIPPED_KEYS = new Set(['title_tag', 'description_tag']);

function stripSeoMetafields(sourceDir) {
  const files = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== '_searchable-attrs.json' && !entry.name.endsWith('-resource-ids.json'));

  let scanned = 0;
  let updated = 0;

  for (const file of files) {
    const filePath = path.join(sourceDir, file.name);
    const entry = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    scanned += 1;

    if (!Array.isArray(entry.metafields)) continue;

    const before = entry.metafields.length;
    entry.metafields = entry.metafields.filter((metafield) => !STRIPPED_KEYS.has(metafield.key));

    if (entry.metafields.length === before) continue;

    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
    console.log(`Stripped ${before - entry.metafields.length} SEO metafield(s) from ${filePath}`);
    updated += 1;
  }

  console.log(`Scanned ${scanned} collection file(s), updated ${updated}.`);
}

const program = new Command();
program
  .name('strip-seo-metafields')
  .description('removes title_tag/description_tag entries from every <source>/<handle>.json collection file\'s metafields array')
  .argument('<source>', 'folder containing collection JSON files')
  .action((source) => {
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
    stripSeoMetafields(sourceDir);
  });

program.parse(process.argv);
