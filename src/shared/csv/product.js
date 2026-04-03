"use strict";

function joinLowerTags(product) {
  if (!product) return "";
  return Array.isArray(product.tags) ? product.tags.join(";").toLowerCase() : "";
}

function findFirstMappedTag(haystacks, tagMap = []) {
  for (const tagConfig of tagMap) {
    const keyword = String(tagConfig?.keywords || "").toLowerCase();
    if (!keyword) continue;

    if (haystacks.some((value) => value.includes(keyword))) {
      return tagConfig.tag || "";
    }
  }

  return "";
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
  const title = String(product.title || "").toLowerCase();
  const description = String(product.description || "").toLowerCase();
  const haystacks = [lowerTags, title, description];
  const tagGroups = csvConfig.tag || {};

  const genderTag = findFirstMappedTag(haystacks, tagGroups.gender);
  const activityTag = findFirstMappedTag(haystacks, tagGroups.activity);
  const otherTag = findFirstMappedTag(haystacks, tagGroups.other);

  return [genderTag, activityTag, otherTag].filter(Boolean).join(", ");
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
