const { calculatePrice } = require("./price.js");
/**
 * This class represents the cart for one session
 */
class Cart {
  items = new Map();
  nextItemId = 1;

  /**
   * Get all items in the cart
   * @return {any[]} The items as an array
   */
  getItems() {
    return [...this.items.values()];
  }

  /** TODO: Add other methods to operate on Cart */

  /**
   * Add a new item to the cart
   * @param {number} artworkId The id of the artwork
   * @param {string} printSize The size of the print
   * @param {string} frameStyle The style of the frame
   * @param {number} frameWidth The width of the frame
   * @param {number} matWidth The width of the mat
   * @param {string} matColor The color of the mat
   * @param {number} price The price of the item
   * @return {number} The id of the newly added item
   */
  addItem(artworkId, printSize, frameStyle, frameWidth, matWidth, matColor) {
    const itemId = this.nextItemId++;

    const currentPrice = calculatePrice(
      printSize,
      frameStyle,
      frameWidth,
      matWidth
    );
    this.items.set(itemId, {
      cartItemId: itemId,
      artworkId,
      price: currentPrice,
      printSize,
      frameStyle,
      frameWidth,
      matWidth,
      matColor,
    });
    return itemId;
  }
}

module.exports = Cart;
