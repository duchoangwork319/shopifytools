"use strict";

/**
 * A reusable promisify helper for the browser
 * @param {Function} fn - The callback-based function to convert
 */
export function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      // Add a custom callback as the last argument
      fn(...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

/**
 * Clean confusable Unicode characters by replacing them with their standard ASCII equivalents.
 * @param {string} str - The string to clean
 * @returns {string} - The cleaned string
 */
export function cleanConfusables(str) {
  const map = {
    '\u2013': '-', // En dash
    '\u2014': '-', // Em dash
    '\u2018': "'", // Left single quote
    '\u2019': "'", // Right single quote
    '\u201c': '"', // Left double quote
    '\u201d': '"', // Right double quote
  };
  // /[\u2013\u2014\u2018\u2019\u201c\u201d]/g
  return str.replace(/[\u2013\u2014\u2018\u2019\u201c\u201d]/g, m => map[m]).replace(/\"\"/g, '"');
}

/**
 * Sanitize HTML content by removing potentially problematic tags and attributes.
 * @param {string} html - The HTML content to sanitize 
 * @returns {string} - The sanitized HTML content
 */
export function sanityHtml(html) {
  const imgRegex = /<img[^>]*>/gi;
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const linkRegex = /<link[^>]*>/gi;
  const videoRegex = /<video[^>]*>([\s\S]*?)<\/video>/gi;
  const audioRegex = /<audio[^>]*>([\s\S]*?)<\/audio>/gi;
  const iframeRegex = /<iframe[^>]*>([\s\S]*?)<\/iframe>/gi;
  const embedRegex = /<embed[^>]*>([\s\S]*?)<\/embed>/gi;
  const objectRegex = /<object[^>]*>([\s\S]*?)<\/object>/gi;
  const noscriptRegex = /<noscript[^>]*>([\s\S]*?)<\/noscript>/gi;
  const pictureRegex = /<picture[^>]*>([\s\S]*?)<\/picture>/gi;
  const sourceRegex = /<source[^>]*>/gi;
  const regexGroup = [imgRegex, scriptRegex, styleRegex, linkRegex, videoRegex, audioRegex, iframeRegex, embedRegex, objectRegex, noscriptRegex, pictureRegex, sourceRegex];
  let cleanedHtml = cleanConfusables(html);
  regexGroup.forEach((regex) => {
    cleanedHtml = cleanedHtml.replace(regex, "");
  });
  return cleanedHtml;
}