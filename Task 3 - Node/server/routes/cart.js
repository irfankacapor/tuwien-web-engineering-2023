/**
 * This module contains the routes under /cart
 */

"use strict";

const express = require("express");
const routes = express.Router();

const Session = require("../utils/session");
const Cart = require("../utils/cart");
const { calculatePrice } = require("../utils/price.js");

const sessionCookieName = "sessionId";

const isInputValid = (
  printSize,
  frameStyle,
  frameWidth,
  matColor,
  matWidth
) => {
  const errors = {};
  if (printSize === undefined) errors.printSize = "missing";
  else if (!(printSize === "S" || printSize === "M" || printSize === "L"))
    errors.printSize = "invalid";

  if (frameStyle === undefined) errors.frameStyle = "missing";
  else if (
    !(
      frameStyle === "shabby" ||
      frameStyle === "classic" ||
      frameStyle === "natural" ||
      frameStyle === "elegant"
    )
  )
    errors.frameStyle = "invalid";

  if (frameWidth === undefined) errors.frameWidth = "missing";
  else if (frameWidth < 20 || frameWidth > 50) errors.frameWidth = "invalid";

  if (
    matColor &&
    !(
      matColor === "tea" ||
      matColor === "cerise" ||
      matColor === "cerulean" ||
      matColor === "oxford" ||
      matColor === "raisin"
    )
  )
    errors.matColor = "invalid";

  if (matWidth === undefined) errors.matWidth = "missing";
  else if (matWidth < 0 || matWidth > 10) errors.matWidth = "invalid";

  const isValid = Object.keys(errors).length === 0;

  return isValid
    ? { message: "Validation passed" }
    : { message: "Validation failed", errors };
};

/**
 * Load the cart for a given SID
 * @param sid The session id
 * @return {Cart|null} The cart, or null if the session does not exist
 */
function loadCart(sid) {
  if (!sid) {
    return null;
  }
  let session = Session.load(sid);
  if (!session) {
    // Create a new session with the given session id
    session = Session.create(sid);
  }

  // Check if session is an object
  if (typeof session === "object") {
    if (!session.cart) {
      // Session exists, but no cart set: Create one
      session.cart = new Cart();
    }
    return session.cart;
  } else {
    // Handle the case where session is not an object
    console.log("Session is not an object:", session);
    return null;
  }
}

/**
 * Get the items for the cart associated with the user's session
 */
routes.get("/", (req, res) => {
  // Reuse the session if cookie is present, create a new one otherwise
  const sid = req.cookies[sessionCookieName] || Session.create();

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  // Set the session id as a cookie
  res.cookie(sessionCookieName, sid);
  res.send(cart.getItems());
});

/** TODO: finish implementation */

module.exports = routes;

routes.post("/", (req, res) => {
  // Check if the request body is empty
  if (Object.keys(req.body).length === 0) {
    res.sendStatus(403);
    return;
  }

  // Reuse the session if cookie is present, create a new one otherwise
  const sid = req.cookies[sessionCookieName] || Session.create();

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  // Extract item data from request body
  const { artworkId, printSize, frameStyle, frameWidth, matWidth, matColor } =
    req.body;

  const validationResult = isInputValid(
    printSize,
    frameStyle,
    frameWidth,
    matColor,
    matWidth
  );
  if (validationResult.message !== "Validation passed") {
    res.status(400).json(validationResult);
    return;
  }

  // Calculate price server-side
  const price = calculatePrice(
    artworkId,
    printSize,
    frameStyle,
    frameWidth,
    matWidth
  );

  // Add new item to cart
  const cartItemId = cart.addItem(
    artworkId,
    printSize,
    frameStyle,
    frameWidth,
    matWidth,
    matColor
  );

  // Set the session id as a cookie
  res.cookie(sessionCookieName, sid);
  res.status(201).send({ cartItemId });
});

routes.delete("/", (req, res) => {
  // Reuse the session if cookie is present
  const sid = req.cookies[sessionCookieName];
  if (!sid) {
    res.sendStatus(403);
    return;
  }

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  // Clear the cart
  cart.items.clear();

  // Send a 204 No Content response
  res.sendStatus(204);
});

routes.delete("/:id", (req, res) => {
  // Reuse the session if cookie is present
  const sid = req.cookies[sessionCookieName];
  if (!sid) {
    res.sendStatus(403);
    return;
  }

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  // Get the item id from the request params
  const itemId = parseInt(req.params.id);

  // Check if the item exists in the cart
  if (!cart.items.has(itemId)) {
    res.sendStatus(404);
    return;
  }

  // Remove the item from the cart
  cart.items.delete(itemId);

  // Send a 204 No Content response
  res.sendStatus(204);
});

routes.get("/:id", (req, res) => {
  // Reuse the session if cookie is present
  const sid = req.cookies[sessionCookieName];
  if (!sid) {
    res.sendStatus(403);
    return;
  }

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  // Get the item id from the request params
  const itemId = parseInt(req.params.id);

  // Check if the item exists in the cart
  const item = cart.items.get(itemId);
  if (!item) {
    res.sendStatus(404);
    return;
  }

  // Send the item as a response
  res.send(item);
});
