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
