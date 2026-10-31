#!/usr/bin/env node
// port-category-tabs.mjs
// One-off data migration (not part of the admin CLI architecture): ports
// the "tab_*" menu-handle groupings from
// ignore/menus_5DLA_Collections_FAQ_Reviewed.xlsx - handle_category-tabs.json
// into theme-azeno-v1/templates/collection.c5dla.basic.json's
// sections.subcollections.blocks, as one `activity_links` block per group.
// Unlike port-related-links.mjs (which added to banner.blocks alongside an
// existing starting block), this REPLACES subcollections.blocks and
// subcollections.block_order entirely - every existing activity_links block
// is discarded. The template file is JSON5-ish (a /* ... */ header comment
// before the object), so the comment is captured and preserved as-is.
import fs from 'fs';

const GROUPS_FILE = 'D:/working/shopify/repo/shopifytools/ignore/menus_5DLA_Collections_FAQ_Reviewed.xlsx - handle_category-tabs.json';
const TEMPLATE_FILE = 'D:/working/shopify/repo/theme-azeno-v1/templates/collection.c5dla.basic.json';

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randomBlockSuffix(length = 6) {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return id;
}

const groups = JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));

const rawTemplate = fs.readFileSync(TEMPLATE_FILE, 'utf8');
const commentEnd = rawTemplate.indexOf('*/') + 2;
const headerComment = rawTemplate.slice(0, commentEnd);
const template = JSON.parse(rawTemplate.slice(commentEnd));

const subcollections = template.sections.subcollections;

const blocks = {};
const blockOrder = [];

for (const [groupKey, collectionList] of Object.entries(groups)) {
  const blockId = `activity_links_${randomBlockSuffix()}`;
  blocks[blockId] = {
    type: 'activity_links',
    settings: {
      title: groupKey,
      links: groupKey,
      collection_list: collectionList,
    },
  };
  blockOrder.push(blockId);
}

subcollections.blocks = blocks;
subcollections.block_order = blockOrder;

const outputJson = JSON.stringify(template, null, 2);
fs.writeFileSync(TEMPLATE_FILE, `${headerComment}\n${outputJson}\n`, 'utf8');

console.log(`Replaced subcollections.blocks with ${blockOrder.length} activity_links block(s) in ${TEMPLATE_FILE}`);
