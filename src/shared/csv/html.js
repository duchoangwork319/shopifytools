"use strict";

/**
 * Change a node tag name while preserving inner HTML.
 * @param {import("cheerio").CheerioAPI} $ - Cheerio API instance
 * @param {import("cheerio").Cheerio<any>} node - Cheerio node
 * @param {string} to - New tag name
 * @returns {import("cheerio").Cheerio<any>}
 */
export function changeTagName($, node, to) {
  return $(`<${to}>`).append(node.html());
}

/**
 * Build the HTML body description for the Shopify CSV.
 * @param {import("cheerio").CheerioAPI|null|undefined} $ - Cheerio API instance
 * @param {Object} product - Product data
 * @returns {string}
 */
export function buildBodyDescription($, product) {
  if (!$) return "";

  const selectors = [
    "#description .lg\\:col-span-5 .font-heading",
    "#description .lg\\:col-span-5 .text-base",
    "#description [data-hashchange-target=\"details-and-materials\"] h2",
    "#description [data-hashchange-target=\"details-and-materials\"] ul",
    "#description [data-hashchange-target=\"details-and-materials\"] ul + p"
  ];
  const finalHtml = selectors
    .map((sel) => {
      const self = $(sel);
      const els = self.removeAttr("class").toArray();
      if (!els || !els.length) return "";
      if (sel.includes("font-heading")) return els.map((el) => $.html(changeTagName($, $(el), "h2"))).join("");
      return els.map((el) => $.html(el)).join("");
    })
    .filter(Boolean)
    .join("");
  return finalHtml.trim() === "" ? product.description : finalHtml.trim();
}

/**
 * Extract meta tags and title text from HTML.
 * @param {import("cheerio").CheerioAPI|null|undefined} $ - Cheerio API instance
 * @returns {Record<string, string>}
 */
export function buildMetaTags($) {
  if (!$) return {};
  const metaTags = {};
  $("meta").each((i, el) => {
    const nameAttr = $(el).attr("name");
    const propertyAttr = $(el).attr("property");
    const contentAttr = $(el).attr("content") || "";
    if (nameAttr) {
      metaTags[nameAttr] = contentAttr;
    } else if (propertyAttr) {
      metaTags[propertyAttr] = contentAttr;
    }
  });
  const titleTag = $("title").first().text() || "";
  return { ...metaTags, title: titleTag };
}
