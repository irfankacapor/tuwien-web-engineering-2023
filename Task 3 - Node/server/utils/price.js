'use strict';

const fs = require('fs');
const path = require('path');

const frames = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/frames.json')));
const frameCost = frames.reduce((z,x) => { z[x.id] = x.cost; return z; }, {});

/**
 * Returns the price of a given frame configuration in euro cents.
 *
 * @param printSize {'S'|'M'|'L'} The size of the print.
 * @param frameStyle {'classic'|'natural'|'shabby'|'elegant'} The type of frame, as a string.
 * @param frameWidth {number} The width of the frame, in millimeters.
 * @param matWidth {number} The width of the mat, in millimeters.
 */
function calculatePrice(printSize, frameStyle, frameWidth, matWidth) {
  const sizeMultiplier = { 'S': 1, 'M': 2, 'L': 3 };
  return (3500 + frameCost[frameStyle] * frameWidth + 5 * matWidth) * sizeMultiplier[printSize];
}

module.exports = { calculatePrice }
