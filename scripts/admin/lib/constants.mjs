// lib/constants.mjs
// Shared <source> layout for the admin CLI: every command's <source>
// argument is the one main data folder, holding one subfolder per business
// object (FOLDER.*) - e.g. <source>/collection, <source>/menu - matching the
// folders actually present under 5dla-data. Each of those subfolders holds
// that object's per-handle JSON files plus FILE.SEARCHABLE_ATTRS and
// FILE.RESOURCE_IDS.
export const FOLDER = {
  COLLECTION: 'collection',
  MENU: 'menu',
  PAGE: 'page',
  SYSTEM_METAFIELD: 'system/metafields',
};

export const FILE = {
  SEARCHABLE_ATTRS: '_searchable-attrs.json',
  RESOURCE_IDS: '_resource-ids.json',
};
