#!/usr/bin/env node
// port-related-links.mjs
// One-off data migration (not part of the admin CLI architecture): ports
// the "related_*" menu-handle groupings from
// ignore/menus_5DLA_Collections_FAQ_Reviewed.xlsx - handle_related-links.json
// into theme-azeno-v1/templates/collection.c5dla.basic.json's
// sections.banner.blocks, as one `related_collection_links` block per group.
// The template file is JSON5-ish (a /* ... */ header comment before the
// object), so the comment is captured and preserved as-is.
import fs from 'fs';

const GROUPS_FILE = 'D:/working/shopify/repo/shopifytools/ignore/menus_5DLA_Collections_FAQ_Reviewed.xlsx - handle_related-links.json';
const TEMPLATE_FILE = 'D:/working/shopify/repo/theme-azeno-v1/templates/collection.c5dla.basic.json';
const STARTING_BLOCK_ID = 'related_collection_links_LhJWjR';
const STARTING_GROUP_KEY = 'related_men_women_fusion_tempo_sale';

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

const banner = template.sections.banner;

if (!banner.blocks[STARTING_BLOCK_ID]) {
  throw new Error(`Expected starting block "${STARTING_BLOCK_ID}" in sections.banner.blocks.`);
}

banner.blocks[STARTING_BLOCK_ID].settings.collection_list = groups[STARTING_GROUP_KEY];

const newBlockOrder = [STARTING_BLOCK_ID];

for (const [groupKey, collectionList] of Object.entries(groups)) {
  if (groupKey === STARTING_GROUP_KEY) continue;

  const blockId = `related_collection_links_${randomBlockSuffix()}`;
  banner.blocks[blockId] = {
    type: 'related_collection_links',
    settings: {
      title: groupKey,
      links: groupKey,
      collection_list: collectionList,
    },
  };
  newBlockOrder.push(blockId);
}

banner.block_order = newBlockOrder;

const outputJson = JSON.stringify(template, null, 2);
fs.writeFileSync(TEMPLATE_FILE, `${headerComment}\n${outputJson}\n`, 'utf8');

console.log(`Ported ${newBlockOrder.length} related_collection_links block(s) into ${TEMPLATE_FILE}`);
