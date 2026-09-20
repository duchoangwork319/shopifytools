"use strict";

import { buildBodyDescription, buildMetaTags } from "./html.js";

function fmtPrice(v) {
  return (v === null || v === undefined || v === "") ? "" : (Number(v) / 100).toFixed(2);
}

/**
 * Get first variant field value
 * @param {Object} product - product object
 * @param {string} field - field name
 * @returns {string|null} field value or null
 */
function getFirstVariantValue(product, field) {
  return (
    product && field && typeof field === "string"
    && Array.isArray(product.variants) && product.variants.length > 0
  ) ? (product.variants[0][field] || null) : null;
}

function has(obj, prop) {
  return (obj && obj[prop]);
}

function splitSku(sku) {
  if (typeof sku !== "string") return "";
  const parts = sku.split("_");
  return parts.length > 1 ? parts[1] : sku;
}

/** No-op mapper for columns with no source data yet. */
function mapEmpty() {
  return "";
}

function mapHandle(p, isMaster, isMediaOnly, { handleSuffix }) {
  let handle = (p.handle || (p.url && p.url.split("/").pop()) || "");
  if (typeof handleSuffix === "string" && handleSuffix) {
    const re = RegExp(`${handleSuffix}$`, "g");
    handle = re.test(handle) ? handle : handle + handleSuffix;
  }
  return handle;
}

function mapTitle(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (p.title || "") : "";
}

function mapBodyHtml(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (buildBodyDescription(p.html, p) || p.description || "") : "";
}

function mapVendor(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? "FUSION" : "";
}

function mapProductCategory(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  // hard code to generate gender field
  return isMaster ? "Apparel & Accessories" : "";
}

function mapType(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (p.type || "") : "";
}

function mapTags(p, isMaster, isMediaOnly, { appendTags }) {
  if (isMediaOnly) return "";
  if (isMaster) {
    const tags = String(has(p, "_tags") ? p._tags : "");
    if (typeof appendTags === "string" && appendTags) {
      const split = tags.split(",");
      split.push(...appendTags.split(","));
      return Array.from(new Set(
        split.map(str => str.trim()).filter(Boolean)
      )).join(", ");
    }
    return tags;
  }
  return "";
}

function mapPublished(p, isMaster, isMediaOnly, { publishProducts }) {
  if (isMediaOnly) return "";
  return ((p.published_at && isMaster) || (publishProducts && isMaster) ? "TRUE" : "");
}

function mapOption1Name(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (Array.isArray(p.options) && p.options[0] && p.options[0].name) || "" : "";
}

function mapOption1Value(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (isMaster) return (getFirstVariantValue(p, "option1") || "").toUpperCase();
  return (has(p, "_variant") && p._variant.option1 ? p._variant.option1 : "").toUpperCase();
}

function mapOption2Name(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (Array.isArray(p.options) && p.options[1] && p.options[1].name) || "" : "";
}

function mapOption2Value(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (isMaster) return (getFirstVariantValue(p, "option2") || "").toUpperCase();
  return (has(p, "_variant") && p._variant.option2 ? p._variant.option2 : "").toUpperCase();
}

function mapOption3Name(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (Array.isArray(p.options) && p.options[2] && p.options[2].name) || "" : "";
}

function mapOption3Value(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (isMaster) return (getFirstVariantValue(p, "option3") || "").toUpperCase();
  return (has(p, "_variant") && p._variant.option3 ? p._variant.option3 : "").toUpperCase();
}

function mapVariantSku(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (isMaster) return splitSku(getFirstVariantValue(p, "sku")) || "";
  if (!isMaster && has(p, "_variant")) return splitSku(p._variant.sku) || "";
  return "";
}

function mapVariantGrams(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (isMaster) return (Number(getFirstVariantValue(p, "weight")) || 0);
  return (has(p, "_variant") && p._variant.weight ? Number(p._variant.weight) : 0);
}

function mapVariantInventoryTracker(p, isMaster, isMediaOnly) {
  return isMediaOnly ? "" : "shopify";
}

function mapVariantInventoryQty(p, isMaster, isMediaOnly) {
  return isMediaOnly ? "" : 0;
}

function mapVariantInventoryPolicy(p, isMaster, isMediaOnly, { inventoryPolicyContinue }) {
  if (isMediaOnly) return "";
  if (inventoryPolicyContinue) return "continue";
  return "deny";
}

function mapVariantFulfillmentService(p, isMaster, isMediaOnly) {
  return isMediaOnly ? "" : "manual";
}

function mapVariantPrice(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (!isMaster && p._variant && p._variant.price !== undefined) return fmtPrice(p._variant.price);
  return isMaster ? fmtPrice(p.price || p.price_min) : "";
}

function mapVariantCompareAtPrice(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return (!isMaster && p._variant ? fmtPrice(p._variant.compare_at_price) : "");
}

function mapVariantRequiresShipping(p, isMaster, isMediaOnly) {
  return isMediaOnly ? "" : "TRUE";
}

function mapVariantTaxable(p, isMaster, isMediaOnly) {
  return isMediaOnly ? "" : "FALSE";
}

function mapVariantBarcode(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (isMaster) return getFirstVariantValue(p, "barcode") || "";
  return has(p, "_variant") ? (p._variant.barcode || "") : "";
}

function mapImageSrc(p) {
  return has(p, "_media") ? p._media.src : "";
}

function mapImagePosition(p) {
  return has(p, "_media") ? p._media.position : "";
}

function mapImageAltText(p) {
  return has(p, "_media") ? p._media.alt : "";
}

function mapGiftCard(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (p.gift_card ? "TRUE" : "FALSE") : "";
}

function mapSeoTitle(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (!isMaster) return "";
  const metaTags = buildMetaTags(p.html);
  return metaTags.title || "";
}

function mapSeoDescription(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (!isMaster) return "";
  const metaTags = buildMetaTags(p.html);
  return metaTags.description || "";
}

function mapGoogleShoppingGender(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster && has(p, "gender") ? p.gender : "";
}

function mapTargetGender(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster && has(p, "gender") ? p.gender : "";
}

function mapVariantImage(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  if (isMaster) {
    const first = getFirstVariantValue(p, "featured_image");
    return first ? first.src || "" : "";
  }
  return (has(p, "_variant") && p._variant.featured_image ? (p._variant.featured_image.src || "") : "");
}

function mapStatus(p, isMaster, isMediaOnly) {
  if (isMediaOnly) return "";
  return isMaster ? (p.published_at ? "active" : "draft") : "";
}

/**
 * Get mapping function by header name. Case order mirrors
 * `src/shared/json/columns.json`.
 * @param {string} header - header name
 * @returns {Function} mapping function
 */
function byHeader(header) {
  switch (header) {
    case "Handle":
      return mapHandle;
    case "Title":
      return mapTitle;
    case "Body (HTML)":
      return mapBodyHtml;
    case "Vendor":
      return mapVendor;
    case "Product Category":
      return mapProductCategory;
    case "Type":
      return mapType;
    case "Tags":
      return mapTags;
    case "Published":
      return mapPublished;
    case "Option1 Name":
      return mapOption1Name;
    case "Option1 Value":
      return mapOption1Value;
    case "Option1 Linked To":
      return mapEmpty;
    case "Option2 Name":
      return mapOption2Name;
    case "Option2 Value":
      return mapOption2Value;
    case "Option2 Linked To":
      return mapEmpty;
    case "Option3 Name":
      return mapOption3Name;
    case "Option3 Value":
      return mapOption3Value;
    case "Option3 Linked To":
      return mapEmpty;
    case "Variant SKU":
      return mapVariantSku;
    case "Variant Grams":
      return mapVariantGrams;
    case "Variant Inventory Tracker":
      return mapVariantInventoryTracker;
    case "Variant Inventory Qty":
      return mapVariantInventoryQty;
    case "Variant Inventory Policy":
      return mapVariantInventoryPolicy;
    case "Variant Fulfillment Service":
      return mapVariantFulfillmentService;
    case "Variant Price":
      return mapVariantPrice;
    case "Variant Compare At Price":
      return mapVariantCompareAtPrice;
    case "Variant Requires Shipping":
      return mapVariantRequiresShipping;
    case "Variant Taxable":
      return mapVariantTaxable;
    case "Unit Price Total Measure":
    case "Unit Price Total Measure Unit":
    case "Unit Price Base Measure":
    case "Unit Price Base Measure Unit":
      return mapEmpty;
    case "Variant Barcode":
      return mapVariantBarcode;
    case "Image Src":
      return mapImageSrc;
    case "Image Position":
      return mapImagePosition;
    case "Image Alt Text":
      return mapImageAltText;
    case "Gift Card":
      return mapGiftCard;
    case "SEO Title":
      return mapSeoTitle;
    case "SEO Description":
      return mapSeoDescription;
    case "Google Shopping / Google Product Category":
      return mapEmpty;
    case "Google Shopping / Gender":
      return mapGoogleShoppingGender;
    case "Google Shopping / Age Group":
    case "Google Shopping / MPN":
    case "Google Shopping / Condition":
    case "Google Shopping / Custom Product":
    case "Google Shopping / Custom Label 0":
    case "Google Shopping / Custom Label 1":
    case "Google Shopping / Custom Label 2":
    case "Google Shopping / Custom Label 3":
    case "Google Shopping / Custom Label 4":
      return mapEmpty;
    case "Badge Label (product.metafields.bwp_fields.badge_label)":
    case "Bundle (product.metafields.bwp_fields.bundle)":
    case "Size Chart (product.metafields.bwp_fields.size_chart)":
      return mapEmpty;
    case "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)":
    case "Product rating count (product.metafields.reviews.rating_count)":
      return mapEmpty;
    case "Accessory size (product.metafields.shopify.accessory-size)":
    case "Activity (product.metafields.shopify.activity)":
    case "Age group (product.metafields.shopify.age-group)":
      return mapEmpty;
    case "Color (product.metafields.shopify.color-pattern)":
      return mapEmpty;
    case "Fabric (product.metafields.shopify.fabric)":
      return mapEmpty;
    case "Target gender (product.metafields.shopify.target-gender)":
      return mapTargetGender;
    case "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)":
    case "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)":
    case "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)":
    case "Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)":
      return mapEmpty;
    case "Variant Image":
      return mapVariantImage;
    case "Variant Weight Unit":
    case "Variant Tax Code":
    case "Cost per item":
      return mapEmpty;
    case "Status":
      return mapStatus;
    default:
      return mapEmpty;
  }
}

/**
 * Build main mapping array from headers. Each entry is { header, map }
 * map(jsonData, isMaster) should return string or primitive value
 * @param {Array} headers - array of header names
 * @returns {Array} mapping array
 */
export function buildMainMap(headers) {
  return headers.map((h) => ({
    header: h,
    map: byHeader(h)
  }));
}

/**
 * Convert a row context into a CSV row array.
 * @param {{ header: string, map: Function }[]} mainMap - Header mapper definitions
 * @param {Object} rowData - Row context
 * @param {boolean} [isMaster=false] - Whether this is a master product row
 * @param {boolean} [isMediaOnly=false] - Whether this is a media-only row
 * @param {boolean} [valuesOnly] - Whether to return values only or an array of { header, value }
 * @param {Object} transformOption - Whether to return values only or an array of { header, value }
 * @returns {Array}
 */
export function mapRow(mainMap, rowData, { isMaster, isMediaOnly, valuesOnly }, transformOption) {
  if (valuesOnly) {
    return mainMap.map((entry) => entry.map(rowData, isMaster, isMediaOnly, transformOption));
  } else {
    return mainMap.map((entry) => ({
      [entry.header]: entry.map(rowData, isMaster, isMediaOnly, transformOption)
    })).reduce((acc, cur) => Object.assign(acc, cur), {});
  }
}
