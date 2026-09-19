"use strict";

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
 * Collect Google target gender from product content.
 * @param {Object} product - Product data
 * @returns {string}
 */
export function collectGender(product) {
  if (!product) return "";

  const lowerTags = joinLowerTags(product);
  if (lowerTags.includes("unisex")) return "female; unisex; male";
  if (lowerTags.includes("women")) return "female";
  if (lowerTags.includes("men")) return "male";
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
  const haystacks = [lowerTags, handle, title, description];
  const tagGroups = csvConfig.tag || {};

  const genderTags = findAllMappedTags(haystacks, tagGroups.gender);
  const activityTags = findAllMappedTags(haystacks, tagGroups.activity);
  const otherTags = findAllMappedTags(haystacks, tagGroups.other);

  const uniqueTags = Array.from(new Set([...genderTags, ...activityTags, ...otherTags]));
  return uniqueTags.join(", ");
}

/**
 * Prepare shared derived fields used by CSV row generation.
 * @param {Object} product - Product data
 * @param {import("cheerio").CheerioAPI|null|undefined} html - Cheerio API instance
 * @param {Object} csvConfig - CSV config containing tag groups
 * @returns {Object}
 */
export function createDerivedProductData(product, html, csvConfig = {}) {
  const gender = collectGender(product);
  const tags = collectTags(product, csvConfig);

  return {
    ...product,
    _variant: null,
    _media: undefined,
    html,
    gender,
    _tags: tags
  };
}
