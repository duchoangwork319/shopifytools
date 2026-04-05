"use strict";

import { buildBodyDescription, buildMetaTags } from "./html.js";

/**
 * Build main mapping array from headers. Each entry is { header, map }
 * map(jsonData, isMaster) should return string or primitive value
 * @param {Array} headers - array of header names
 * @returns {Array} mapping array
 */
export function buildMainMap(headers) {
  const fmtPrice = (v) => (v === null || v === undefined || v === "") ? "" : (Number(v) / 100).toFixed(2);

  /**
   * Get first variant field value
   * @param {Object} product - product object
   * @param {string} field - field name
   * @returns {string|null} field value or null
   */
  const getFirstVariantValue = (product, field) => {
    return (
      product && field && typeof field === "string"
      && Array.isArray(product.variants) && product.variants.length > 0
    ) ? (product.variants[0][field] || null) : null;
  };

  const has = (obj, prop) => {
    return (obj && obj[prop]);
  };

  const splitSku = (sku) => {
    if (typeof sku !== "string") return "";
    const parts = sku.split("_");
    return parts.length > 1 ? parts[1] : sku;
  };

  /**
   * Get mapping function by header name
   * @param {string} header - header name
   * @returns {Function} mapping function
   */
  const byHeader = (header) => {
    switch (header) {
      case "Handle":
        return (p, isMaster, isMediaOnly) => {
          return p.handle || (p.url && p.url.split("/").pop()) || "";
        };
      case "Title":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (p.title || "") : "";
        };
      case "Body (HTML)":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (buildBodyDescription(p.html, p) || p.description || "") : "";
        };
      case "Vendor":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? "FUSION" : "";
        };
      case "Product Category":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          // hard code to generate gender field
          return isMaster ? "Apparel & Accessories" : "";
        };
      case "Type":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (p.type || "") : "";
        };
      case "Tags":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster && has(p, "_tags") ? p._tags : "";
        };
      case "Published":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return (p.published_at && isMaster ? "TRUE" : "");
        };
      case "Option1 Name":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (Array.isArray(p.options) && p.options[0] && p.options[0].name) || "" : "";
        };
      case "Option1 Value":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (isMaster) return (getFirstVariantValue(p, "option1") || "").toUpperCase();
          return (has(p, "_variant") && p._variant.option1 ? p._variant.option1 : "").toUpperCase();
        };
      case "Option1 Linked To":
        return () => "";
      case "Option2 Name":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (Array.isArray(p.options) && p.options[1] && p.options[1].name) || "" : "";
        };
      case "Option2 Value":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (isMaster) return (getFirstVariantValue(p, "option2") || "").toUpperCase();
          return (has(p, "_variant") && p._variant.option2 ? p._variant.option2 : "").toUpperCase();
        };
      case "Option2 Linked To":
        return () => "";
      case "Option3 Name":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (Array.isArray(p.options) && p.options[2] && p.options[2].name) || "" : "";
        };
      case "Option3 Value":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (isMaster) return (getFirstVariantValue(p, "option3") || "").toUpperCase();
          return (has(p, "_variant") && p._variant.option3 ? p._variant.option3 : "").toUpperCase();
        };
      case "Option3 Linked To":
        return () => "";
      case "Variant SKU":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (isMaster) return splitSku(getFirstVariantValue(p, "sku")) || "";
          if (!isMaster && has(p, "_variant")) return splitSku(p._variant.sku) || "";
          return "";
        };
      case "Variant Grams":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (isMaster) return (Number(getFirstVariantValue(p, "weight")) || 0);
          return (has(p, "_variant") && p._variant.weight ? Number(p._variant.weight) : 0);
        };
      case "Variant Inventory Tracker":
        return (p, isMaster, isMediaOnly) => isMediaOnly ? "" : "shopify";
      case "Variant Inventory Qty":
        return (p, isMaster, isMediaOnly) => isMediaOnly ? "" : 0;
      case "Variant Inventory Policy":
        return (p, isMaster, isMediaOnly) => isMediaOnly ? "" : "deny";
      case "Variant Fulfillment Service":
        return (p, isMaster, isMediaOnly) => isMediaOnly ? "" : "manual";
      case "Variant Price":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (!isMaster && p._variant && p._variant.price !== undefined) return fmtPrice(p._variant.price);
          return isMaster ? fmtPrice(p.price || p.price_min) : "";
        };
      case "Variant Compare At Price":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return (!isMaster && p._variant ? fmtPrice(p._variant.compare_at_price) : "");
        };
      case "Variant Requires Shipping":
        return (p, isMaster, isMediaOnly) => isMediaOnly ? "" : "TRUE";
      case "Variant Taxable":
        return (p, isMaster, isMediaOnly) => isMediaOnly ? "" : "FALSE";
      case "Unit Price Total Measure":
      case "Unit Price Total Measure Unit":
      case "Unit Price Base Measure":
      case "Unit Price Base Measure Unit":
        return () => "";
      case "Variant Barcode":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (isMaster) return getFirstVariantValue(p, "barcode") || "";
          return has(p, "_variant") ? (p._variant.barcode || "") : "";
        };
      case "Image Src":
        return (p, isMaster, isMediaOnly) => {
          return has(p, "_media") ? p._media.src : "";
        };
      case "Image Position":
        return (p, isMaster, isMediaOnly) => {
          return has(p, "_media") ? p._media.position : "";
        };
      case "Image Alt Text":
        return (p, isMaster, isMediaOnly) => {
          return has(p, "_media") ? p._media.alt : "";
        };
      case "Gift Card":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (p.gift_card ? "TRUE" : "FALSE") : "";
        };
      case "SEO Title":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (!isMaster) return "";
          const metaTags = buildMetaTags(p.html);
          return metaTags.title || "";
        };
      case "SEO Description":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (!isMaster) return "";
          const metaTags = buildMetaTags(p.html);
          return metaTags.description || "";
        };
      case "Google Shopping / Google Product Category":
        return () => "";
      case "Google Shopping / Gender":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster && has(p, "gender") ? p.gender : "";
        };
      case "Google Shopping / Age Group":
      case "Google Shopping / MPN":
      case "Google Shopping / Condition":
      case "Google Shopping / Custom Product":
      case "Google Shopping / Custom Label 0":
      case "Google Shopping / Custom Label 1":
      case "Google Shopping / Custom Label 2":
      case "Google Shopping / Custom Label 3":
      case "Google Shopping / Custom Label 4":
      case "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)":
      case "Product rating count (product.metafields.reviews.rating_count)":
      case "Color (product.metafields.shopify.color-pattern)":
        return () => "";
      case "Target gender (product.metafields.shopify.target-gender)":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster && has(p, "gender") ? p.gender : "";
        };
      case "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)":
      case "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)":
      case "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)":
      case "Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)":
        return () => "";
      case "Variant Image":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          if (isMaster) {
            const first = getFirstVariantValue(p, "featured_image");
            return first ? first.src || "" : "";
          }
          return (has(p, "_variant") && p._variant.featured_image ? (p._variant.featured_image.src || "") : "");
        };
      case "Variant Weight Unit":
      case "Variant Tax Code":
      case "Cost per item":
        return () => "";
      case "Status":
        return (p, isMaster, isMediaOnly) => {
          if (isMediaOnly) return "";
          return isMaster ? (p.published_at ? "active" : "draft") : "";
        };
      default:
        return () => "";
    }
  };

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
 * @returns {Array}
 */
export function mapRow(mainMap, rowData, { isMaster = false, isMediaOnly = false, valuesOnly }) {
  if (valuesOnly) {
    return mainMap.map((entry) => entry.map(rowData, isMaster, isMediaOnly));
  } else {
    return mainMap.map((entry) => ({
      [entry.header]: entry.map(rowData, isMaster, isMediaOnly)
    })).reduce((acc, cur) => Object.assign(acc, cur), {});
  }
}
