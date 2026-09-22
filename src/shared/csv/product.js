"use strict";

import { buildBodyDescription, buildMetaTags } from "./html.js";

function joinLowerTags(product) {
  if (!product) return "";
  return Array.isArray(product.tags) ? product.tags.join(";").toLowerCase() : "";
}

/**
 * Find all matching tags from the tag map based on the haystacks.
 * @param {string[]} haystacks - Array of strings to search within (e.g., tags, title, description)
 * @param {Object[]} tagMap - Array of tag configurations with keywords and corresponding tags
 * @returns {string[]} - All matching tags, in tagMap order (empty array if no match is found)
 */
function findAllMappedTags(haystacks, tagMap = []) {
  const matchedTags = [];

  for (const tagConfig of tagMap) {
    const keyword = String(tagConfig?.keywords || "").toLowerCase();
    if (!keyword || !tagConfig.tag) continue;

    const humanizedKeyword = keyword.replaceAll("_", " ");

    if (haystacks.some((value) => value.includes(keyword) || value.includes(humanizedKeyword))) {
      matchedTags.push(tagConfig.tag);
    }
  }

  return matchedTags;
}

/**
 * Find the first matching tag from the tag map based on the haystacks,
 * stopping at the first hit in tagMap order. Used for gender, where
 * collecting every match is wrong — e.g. "women" contains "men" as a
 * substring, so an all-matches search would incorrectly tag a women's
 * product as also being a men's product. Config order (Unisex, Women, Men)
 * establishes the priority: Unisex is checked before Women/Men, and Women
 * is checked before Men so its match wins first.
 * @param {string[]} haystacks - Array of strings to search within
 * @param {Object[]} tagMap - Array of tag configurations with keywords and corresponding tags
 * @returns {string} - The first matching tag, or "" if no match is found
 */
function findFirstMappedTag(haystacks, tagMap = []) {
  for (const tagConfig of tagMap) {
    const keyword = String(tagConfig?.keywords || "").toLowerCase();
    if (!keyword || !tagConfig.tag) continue;

    const humanizedKeyword = keyword.replaceAll("_", " ");

    if (haystacks.some((value) => value.includes(keyword) || value.includes(humanizedKeyword))) {
      return tagConfig.tag;
    }
  }

  return "";
}

/**
 * Build CSV tag string from product content and config.
 * @param {Object} product - Product data
 * @param {Object} csvConfig - CSV config containing tag groups
 * @returns {string}
 */
export function collectTags(product, csvConfig = {}) {
  if (!product) return "";

  const lowerTags = joinLowerTags(product);
  const handle = String(product.handle || "").toLowerCase();
  const title = String(product.title || "").toLowerCase();
  const description = String(product.description || "").toLowerCase();
  const genderHaystacks = [lowerTags, handle, title];
  const haystacks = [lowerTags, handle, title, description];
  const tagGroups = csvConfig.tag || {};

  const genderTag = findFirstMappedTag(genderHaystacks, tagGroups.gender);
  const activityTags = findAllMappedTags(haystacks, tagGroups.activity);
  const otherTags = findAllMappedTags(haystacks, tagGroups.other);
  const unisexTag = findFirstMappedTag(haystacks, tagGroups.unisex);

  const uniqueTags = Array.from(new Set([genderTag, unisexTag, ...activityTags, ...otherTags].filter(Boolean)));
  return uniqueTags.join(", ");
}

/**
 * Prepare shared derived fields used by CSV row generation. `buildBodyDescription`
 * and `buildMetaTags` are run once here (rather than lazily inside each
 * column mapper in mapping.js), so their output is available up front and
 * can also feed `collectTags` — the cleaned body description is a better
 * haystack for tag keyword matching than the raw, unprocessed product
 * description.
 * @param {Object} product - Product data
 * @param {import("cheerio").CheerioAPI|Document|null|undefined} html - Parsed HTML
 * @param {Object} csvConfig - CSV config containing tag groups
 * @returns {Object}
 */
export function createDerivedProductData(product, html, csvConfig = {}) {
  const bodyDescription = buildBodyDescription(html, product) || "";
  const joinDescription = [bodyDescription, product.description].filter(Boolean).join(" ");
  const metaTags = buildMetaTags(html);
  const tags = collectTags({ ...product, description: joinDescription }, csvConfig);

  return {
    ...product,
    _variant: null,
    _media: undefined,
    html,
    _tags: tags,
    _bodyDescription: bodyDescription,
    _seoTitle: metaTags.title || "",
    _seoDescription: metaTags.description || ""
  };
}
