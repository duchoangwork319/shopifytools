"use strict";

import axios from "axios";
import xml2js from "xml2js";
import { promisify } from "./util.js";

// Fetch and parse XML content
export async function fetchXMLContent(url) {
  try {
    const response = await axios.get(url);
    const parseXML = promisify(xml2js.parseString);
    return parseXML(response.data);
  } catch (error) {
    console.error(`Error fetching/parsing XML from ${url}:`, error.message);
    throw error;
  }
};

// Fetch and save product data
export async function fetchProduct(apiUrl, options) {
  try {
    const response = await axios.get(apiUrl);
    const isHtmlMode = options.mode === "html";
    return isHtmlMode ? response.data : JSON.stringify(response.data, null, 2);
  } catch (error) {
    console.error(`Error processing ${apiUrl}:`, error.message);
  }
};