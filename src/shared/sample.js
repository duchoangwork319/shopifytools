"use strict";

import { fetchProduct } from "./api";
import { buildMainMap } from "./csv/mapping";
import { createProductCsvRowsWithMap } from "./csv/rows";
import header from "./json/header.json" with { type: "json" };
import config from "./json/config.json" with { type: "json" };

async function sample(productUrl) {
  const productJson = await fetchProduct(`${productUrl}.js`, {
    mode: "json"
  });
  const productHtml = await fetchProduct(productUrl, {
    mode: "json"
  });
  const mainMap = buildMainMap(header.headers);
  const productHtmlDOM = new DOMParser().parseFromString(productHtml, "text/html");

  const { rows } = createProductCsvRowsWithMap({
    product: JSON.parse(productJson),
    html: productHtmlDOM,
    mainMap,
    csvConfig: config
  });

  return rows;
}
