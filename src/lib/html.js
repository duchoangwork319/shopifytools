"use strict";

/**
 * Change a node tag name while preserving inner HTML.
 * @param {Document} doc - Parsed HTML document
 * @param {Element} node - DOM element
 * @param {string} to - New tag name
 * @returns {Element}
 */
export function changeTagName(doc, node, to) {
  const nextNode = doc.createElement(to);
  nextNode.innerHTML = node.innerHTML;
  return nextNode;
}

/**
 * Remove all attributes of an element
 * @param {HTMLElement} element - Target HTML element
 */
function removeAllAttrs(element) {
  [...element.attributes].forEach(attr => element.removeAttribute(attr.name));
}

/**
 * Build the HTML body description for the Shopify CSV.
 * @param {Document|null|undefined} doc - Parsed HTML document
 * @param {Object} product - Product data
 * @returns {string}
 */
export function buildBodyDescription(doc, product = {}) {
  if (!doc) return product.description || "";

  const selectors = [
    "#description .hidden .font-heading",
    "#description .hidden .font-heading ~ .rte",
    "div[data-tab-content=\"details_and_materials\"]"
  ];

  const finalHtml = selectors.map((sel) => {
    const self = Array.from(doc.querySelectorAll(sel));
    return self.map(el => {
      if (el.classList.value.includes("font-heading")) {
        const h2 = document.createElement("h2");
        h2.textContent = el.textContent;
        return h2.outerHTML;
      }
      if (el.getAttribute("data-tab-content") === "details_and_materials") {
        Array.from(el.querySelectorAll("*")).forEach(innerEl => removeAllAttrs(innerEl));
        return "<h2>Details and materials</h2>" + el.innerHTML;
      }
      removeAllAttrs(el);
      return el.outerHTML;
    }).join("") || "";
  })
    .filter(Boolean)
    .join("");

  return finalHtml.trim() || product.description || "";
}

/**
 * Extract meta tags and title text from HTML.
 * @param {Document|null|undefined} doc - Parsed HTML document
 * @returns {Record<string, string>}
 */
export function buildMetaTags(doc) {
  if (!doc) return {};

  const metaTags = Array.from(doc.querySelectorAll("meta")).reduce((acc, meta) => {
    const nameAttr = meta.getAttribute("name");
    const propertyAttr = meta.getAttribute("property");
    const contentAttr = meta.getAttribute("content") || "";
    if (nameAttr) acc[nameAttr] = contentAttr;
    else if (propertyAttr) acc[propertyAttr] = contentAttr;
    return acc;
  }, {});

  metaTags.title = doc.querySelector("title")?.textContent || "";

  return metaTags;
}
