'use strict';

const crypto = require('crypto');

/**
 * Generates a 12-digit personalUniqueId, mimicking an Aadhaar-like identifier.
 * Always returns exactly 12 numeric characters.
 */
function generateUniqueId() {
  let result = '';
  while (result.length < 12) {
    const buf = crypto.randomBytes(8);
    for (let i = 0; i < buf.length && result.length < 12; i += 1) {
      result += String(buf[i] % 10);
    }
  }
  if (result[0] === '0') {
    result = '1' + result.slice(1);
  }
  return result;
}

module.exports = generateUniqueId;
