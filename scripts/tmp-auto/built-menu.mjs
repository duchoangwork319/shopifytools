#!/usr/bin/env node
// built-menu.mjs
// Temporary automation script (not part of the admin CLI architecture):
// reads the "related links" column of a CSV (handle, group of title/URL
// pairs) and builds one menuCreate-input-shaped JSON file per unique set of
// links - matching the shape of 5dla-data/menus/shop-by-sport-cycling.json,
// minus the ids/resourceIds a menu only gets once it's actually created.
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// A related-links column looks like alternating "Title" / "https://..."
// lines, in groups separated by blank lines, e.g.:
//   Women's Cycling
//   https://5dla.com/collections/womens-cycling
//
//   Women
//   https://5dla.com/collections/womens
const URL_LINE = /^https?:\/\//;

// Parses a collection's raw related-links text into an ordered list of
// { title, url } pairs: non-empty lines are taken two at a time - a title
// line followed by its URL line - in the order they appear.
export function parseMenuItems(raw) {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const items = [];
  for (let i = 0; i < lines.length; i += 2) {
    const title = lines[i];
    const url = lines[i + 1];
    if (!title || !url || !URL_LINE.test(url)) {
      console.warn(`Skipping unpaired related-link line: "${title ?? ''}"`);
      continue;
    }
    items.push({ title, url: new URL(url).pathname });
  }

  return items;
}

// "Women's Cycling" -> "womens-cycling": lower-cased, special characters
// stripped, words joined with "-".
function slugifyTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('-');
}

// Builds the menu's `handle` (each title slugified, joined with "_") and
// `title` (every title, joined with a space). `titlePrefix`, when given, is
// treated as a leading title - it's folded into both, but never added to
// `items` itself.
export function buildMenuNames(items, titlePrefix) {
  const titles = items.map(({ title }) => title);
  if (titlePrefix) titles.unshift(titlePrefix);

  return {
    handle: titles.map(slugifyTitle).join('_'),
    title: titles.join(' '),
  };
}

// Builds a menuCreate-input-shaped object from a collection's raw
// related-links text: { handle, title, isDefault: false, items: [{ title,
// url }] }. No id/resourceId - those only exist once the menu is created.
export function buildMenu(raw, titlePrefix) {
  const items = parseMenuItems(raw);
  const { handle, title } = buildMenuNames(items, titlePrefix);
  return { handle, title, isDefault: false, items };
}

const program = new Command();
program
  .name('built-menu')
  .description('Builds one menu JSON file per unique related-links group found in a CSV.')
  .argument('<csvPath>', 'path to the handle/related-links CSV file')
  .argument('<output>', 'folder to write each <handle>.json menu file to')
  .option('--title-prefix <text>', 'leading title folded into every menu\'s handle and title')
  .action((csvPath, output, opts) => {
    const csvFile = path.resolve(csvPath);
    if (!fs.existsSync(csvFile)) {
      console.error(`Missing CSV file: ${csvFile}`);
      process.exitCode = 1;
      return;
    }

    const parsed = Papa.parse(fs.readFileSync(csvFile, 'utf8'), { skipEmptyLines: true });
    if (parsed.errors.length) {
      console.error('CSV parse errors:', JSON.stringify(parsed.errors, null, 2));
      process.exitCode = 1;
      return;
    }

    const outputDir = path.resolve(output);
    fs.mkdirSync(outputDir, { recursive: true });

    const [, ...rows] = parsed.data;
    // Groups collection handles by the menu.handle they resolve to - since
    // several collections often share the exact same related links, and so
    // end up needing the exact same menu.
    const groups = {};

    for (const [collectionHandle, raw] of rows) {
      const menu = buildMenu(raw ?? '', opts.titlePrefix);
      if (!menu.handle) {
        console.warn(`Skipping collection "${collectionHandle}" - no related links found.`);
        continue;
      }

      const isDuplicate = Object.hasOwn(groups, menu.handle);
      groups[menu.handle] = groups[menu.handle] ?? [];
      groups[menu.handle].push(collectionHandle);

      if (isDuplicate) {
        console.log(`Collection "${collectionHandle}" shares menu "${menu.handle}" with an earlier collection - not rewriting.`);
        continue;
      }

      const menuFile = path.resolve(outputDir, `${menu.handle}.json`);
      fs.writeFileSync(menuFile, JSON.stringify(menu, null, 2), 'utf8');
      console.log(`Saved menu "${menu.title}" (${menu.handle}) for collection "${collectionHandle}" to ${menuFile}`);
    }

    const menuKeys = Object.keys(groups);
    console.log(`\nScanned ${rows.length} collection(s) - wrote ${menuKeys.length} unique menu file(s) to ${outputDir}.`);

    const groupsFile = path.resolve(path.dirname(csvFile), `menus_${path.basename(csvFile, '.csv')}.json`);
    fs.writeFileSync(groupsFile, JSON.stringify(groups, null, 2), 'utf8');
    console.log(`Saved menu groupings to ${groupsFile}`);
  });

program.parse(process.argv);
