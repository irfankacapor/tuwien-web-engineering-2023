/**
 * This module contains the routes under /cart/checkout
 */

'use strict';

const express = require('express');
const routes = express.Router();

const fetch = require('node-fetch');
const { writeOrder } = require('../utils/order');
const fs = require('fs');
const path = require('path');

const BLING_BASE_URL = "https://web-engineering.big.tuwien.ac.at/s23/bling";

async function createPaymentIntent(amount) {
  const ARTMART_BASE_URL_CUR = process.env.ARTMART_BASE_URL;
  console.log(ARTMART_BASE_URL_CUR);
  const res = await fetch(BLING_BASE_URL + "/payment_intents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(process.env.BLING_API_KEY + ":")}`,
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
}

const destinations = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../resources/shipping.json"))
);
const shippingCosts = {};
for (const dest of destinations.countries) {
  shippingCosts[dest.isoCode] = dest;
}

function calculateShippingCosts(countryIsoCode, subtotal) {
  const country = shippingCosts[countryIsoCode];
  if (
    country.freeShippingPossible &&
    subtotal >= country.freeShippingThreshold
  ) {
    return 0;
  }
  return country.price;
}

/** TODO: add checkout routes  */

module.exports = routes;

const Session = require("../utils/session");
const sessionCookieName = "sessionId";

routes.post("/", async (req, res) => {
  // Reuse the session if cookie is present
  const sid = req.cookies[sessionCookieName];
  if (!sid) {
    res.sendStatus(403);
    return;
  }

  // Load the session
  const session = Session.load(sid);
  if (!session) {
    res.sendStatus(403);
    return;
  }

  // Check if the cart is empty
  if (session.cart.getItems().length === 0) {
    res.sendStatus(400);
    return;
  }

  // Validate customer information
  if (!req.body.email || !req.body.shipping_address) {
    res.sendStatus(400);
    return;
  }

  // Store customer information in session
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
});

routes.post("/cart/checkout/payment-update", async (req, res) => {
  // Load the session
  const sid = req.cookies[sessionCookieName];
  if (!sid) {
    res.sendStatus(400);
    return;
  }
  const session = Session.load(sid);
  if (!session) {
    res.sendStatus(400);
    return;
  }

  // Check if the payment intent ID matches
  if (req.body.payment_intent.id !== session.paymentIntentId) {
    res.sendStatus(400);
    return;
  }

  // Check if the payment intent status is succeeded
  if (req.body.payment_intent.status === "succeeded") {
    // Create a receipt for the successful order
    const receipt = {
      email: session.email,
      shipping_address: session.shipping_address,
      items: session.cart.getItems(),
      total: session.total,
    };
    writeOrder(receipt);

    // Empty the shopping cart
    session.cart.empty();

    // Send response
    res.sendStatus(204);
  } else {
    // Handle other payment intent statuses here
  }
});



