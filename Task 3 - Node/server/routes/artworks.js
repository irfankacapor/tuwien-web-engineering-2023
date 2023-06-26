/**
 * This module contains the routes under /artworks
 */

"use strict";

const express = require("express");
const routes = express.Router();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const MET_BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1";
const highlights = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../resources/highlights.json"))
).highlights;

const NodeCache = require("node-cache");
const cache = new NodeCache();

async function getArtwork(artworkId) {
  /** Check if response is already cached */
  const cachedResponse = cache.get(artworkId);
  if (cachedResponse) {
    return cachedResponse;
  }

  /** If response is not cached, fetch from Met API */
  const res = await fetch(MET_BASE_URL + "/objects/" + artworkId);
  if (!res.ok) {
    return null;
  }
  const obj = await res.json();
  if (!obj || !obj.objectID) {
    return null;
  }

  /** Transform response to right structure*/
  const finalResponse = {
    artworkId: obj.objectID,
    title: obj.title,
    artist: obj.artistDisplayName,
    date: obj.objectDate,
    image: obj.primaryImageSmall,
  };

  /** Cache response */
  cache.set(artworkId, finalResponse);

  return finalResponse;
}

routes.get("/", async (req, res) => {
  if (req.query.q == null) {
    // Return highlights
    const highlightsDetails = await Promise.all(
      highlights.map(async (highlightId) => {
        return await getArtwork(highlightId);
      })
    );
    res.send(highlightsDetails);
  } else {
    // Search for artworks
    const cacheKey = `search:${req.query.q}`;
    const cachedSearchResults = cache.get(cacheKey); // get the artworks associated with this search from cache
    if (cachedSearchResults) {
      res.send(cachedSearchResults); // If there are cached results, just send them
      console.log("got it from cache");
      return;
    }

    // Make a search to the MET Api
    const searchRes = await fetch(`${MET_BASE_URL}/search?q=${req.query.q}`);
    if (!searchRes.ok) {
      res.sendStatus(500);
      return;
    }
    // Convert to json
    const searchResults = await searchRes.json();
    if (!searchResults.objectIDs) {
      // If there are no objects found
      res.send([]); // Return an empty array
      return;
    }

    const objectIDs = searchResults.objectIDs.slice(0, 100);
    const artworks = await Promise.all(
      objectIDs.map(async (objectID) => {
        return await getArtwork(objectID);
      })
    );

    cache.set(cacheKey, artworks);

    res.send(artworks);
  }
});

routes.get("/:id", async (req, res) => {
  const artwork = await getArtwork(parseInt(req.params.id));
  if (artwork == null) {
    res.sendStatus(404);
  } else {
    res.send(artwork);
  }
});

module.exports = routes;
