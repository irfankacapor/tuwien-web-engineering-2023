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
const frames = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../resources/frames.json"))
);

routes.get("/", (req, res) => {
  // TODO: write route that takes all the
  let response = [];
  for (const frame of frames) {
    let frameBorder = frame.border;
    let frameSlice = frameBorder.slice;
    response.push(
      JSON.parse(
        JSON.stringify({
          style: frame.id,
          label: frame.label,
          slice: frameSlice,
          cost: frame.cost,
        })
      )
    );
  }
  res.status(200).send(response);
});

routes.get("/:label/:image", (req, res) => {
  let currentLabel = req.params.label;
  let currentImage = req.params.image;
  console.log(currentLabel);
  console.log(currentImage);
  if (currentImage === "thumbImage") {
    for (const frame of frames) {
      if (frame.id === currentLabel) {
        const image = fs.readFileSync(
          path.join(__dirname, "../resources/" + frame.image)
        );
        res.contentType("image/png");
        res.status(200).send(image);
        return;
      }
    }
  }
  res.status(404).send();
});

module.exports = routes;
