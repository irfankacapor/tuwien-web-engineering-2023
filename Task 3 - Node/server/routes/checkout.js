/**
 * This module contains the routes under /cart/checkout
 */

"use strict";

const express = require("express");
const routes = express.Router();
const fetch = require("node-fetch");
const { writeOrder, formData } = require("../utils/order");
const fs = require("fs");
const path = require("path");
let order_sid;

const BLING_BASE_URL = "https://web-engineering.big.tuwien.ac.at/s23/bling";

const createPaymentIntent = async (amount) => {
  const ARTMART_BASE_URL_CUR = process.env.ARTMART_BASE_URL;
  const res = await fetch(BLING_BASE_URL + "/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(process.env.BLING_API_KEY + ":")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount,
      currency: "eur",
      webhook: ARTMART_BASE_URL_CUR + "/cart/checkout/payment-update",
    }),
  });
  if (!res.ok) {
    return null;
  }
  return await res.json();
};

const calculateShippingCosts = (countryIsoCode, subtotal) => {
  const destinations = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../resources/shipping.json"))
  );

  const shippingCosts = {};
  for (const dest of destinations.countries) {
    shippingCosts[dest.isoCode] = dest;
  }

  const country = shippingCosts[countryIsoCode];
  if (
    country.freeShippingPossible &&
    subtotal >= country.freeShippingThreshold
  ) {
    return 0;
  }
  return country.price;
};

/** TODO: add checkout routes  */

module.exports = routes;

const Session = require("../utils/session");
const Cart = require("../utils/cart");
const sessionCookieName = "sessionId";

/**
 * Expose a POST route for the root path ("/").
 * This route handles incoming POST requests to the root path of the server.
 */

routes.post("/", async (req, res) => {
  // Reuse the session if cookie is present
  try {
    const sid = req.cookies[sessionCookieName];
    const session = Session.load(sid);
    if (
      session.cart.getItems().length === 0 ||
      !req.body.email ||
      !req.body.shipping_address
    ) {
      res.sendStatus(400);
      return;
    }
    order_sid = sid;
    session.email = req.body.email;
    session.shipping_address = req.body.shipping_address;

    // Calculate the total price of all items in the cart
    const subtotal = session.cart
      .getItems()
      .reduce((total, item) => total + item.price, 0);

    // Calculate shipping costs
    const shippingCosts = calculateShippingCosts(
      req.body.shipping_address.country,
      subtotal
    );

    // Create payment intent
    const paymentIntent = await createPaymentIntent(subtotal + shippingCosts);
    if (!paymentIntent) {
      res.sendStatus(500);
      return;
    }

    // Store payment intent and total in session
    session.paymentIntentId = paymentIntent.id;
    session.total = subtotal + shippingCosts;

    // Send response
    res.send({
      payment_intent_id: session.paymentIntentId,
      client_secret: paymentIntent.client_secret,
      amount: subtotal + shippingCosts,
      currency: "eur",
    });
  } catch (error) {
    res.status(403).send(error);
    return;
  }
});

/**
 * Expose a POST route for the "/cart/checkout/payment-update" path.
 * This route serves as a webhook used during the Bling payment process.
 * It returns a 400 Bad Request response for all requests except for legitimate Bling events
 * corresponding to orders in the system.
 */

routes.post("/payment-update", async (req, res) => {
  try {
    const session = Session.load(order_sid);
    if (session.cart.getItems().length === 0) {
      res.send(400).send("Cart is empty!");
      return;
    }
    const data = formData(req, session);

    if (req.body.type === "payment.succeeded") {
      res.status(204).send(writeOrder(data));
      session.cart = new Cart();
      return;
    }

    if (req.body.type === "payment.failed") {
      res.status(204).send();
      return;
    }
  } catch (error) {
    res.status(400).send();
  }
});
