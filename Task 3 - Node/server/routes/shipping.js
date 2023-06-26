/**
 /* 
    This module contains the routes under /shipping
 */

"use strict";

const express = require("express");
const routes = express.Router();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const MET_BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1";
const shippingDetails = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../resources/shipping.json"))
);

routes.get("/", (req, res) => {
  res.status(200).json(shippingDetails);
});

module.exports = routes;