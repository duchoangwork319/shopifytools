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
 * Remove all attributes of an element
 * @param {import("cheerio").Cheerio<any>} element - Cheerio element
 */
function removeAllAttrs(element) {
  const attribs = element.attr() || {};
  Object.keys(attribs).forEach(attr => element.removeAttr(attr));
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
    "#description .hidden .font-heading",
    "#description .hidden .font-heading ~ .rte",
    "div[data-tab-content=\"details_and_materials\"]"
  ];
  const finalHtml = selectors
    .map((sel) => {
      const self = $(sel);
      const els = self.toArray();

      if (!els || !els.length) return "";
      if (self.hasClass("font-heading")) {
        return els.map((el) => $.html(changeTagName($, $(el), "h2"))).join("");
      }
      if (self.attr("data-tab-content") === "details_and_materials") {
        removeAllAttrs(self);
        self.find("*").each((i, innerEl) => {
          removeAllAttrs($(innerEl));
        });
        return "<h2>Details and materials</h2>" + els.map((el) => $.html(el)).join("");
      }
      removeAllAttrs(self);
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
