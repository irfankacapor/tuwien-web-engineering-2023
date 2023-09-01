const fs = require("fs");
const path = require("path");

/**
 * Write a new order with the given data into the /orders folder.
 */
function writeOrder(data) {
  const outputDir = path.join(__dirname, "../orders");
  const lastFile = fs.readdirSync(outputDir).sort().pop();
  const n = parseInt(lastFile.match(/order-([0-9]+).json/)[1]);
  const nextFilename = `order-${String(n + 1).padStart(4, "0")}.json`;
  fs.writeFileSync(path.join(outputDir, nextFilename), JSON.stringify(data));
}

const formData = (req, session) => {
  const data = {
    order_date: req.body.created_at,
    email: session.email,
    shipping_address: session.shipping_address,
    card: req.body.payment_intent.card,
    amount: req.body.payment_intent.amount,
    currency: req.body.payment_intent.currency,
    cart: session.cart.getItems().map((cartItem) => {
      const {
        artworkId,
        printSize,
        frameStyle,
        frameWidth,
        matWidth,
        matColor,
        price,
      } = cartItem;
      return {
        artworkId: artworkId,
        printSize: printSize,
        frameStyle: frameStyle,
        frameWidth: frameWidth,
        matWidth: matWidth,
        matColor: matColor,
        price: price,
      };
    }),
  };
  return data;
};

module.exports = { writeOrder, formData };
