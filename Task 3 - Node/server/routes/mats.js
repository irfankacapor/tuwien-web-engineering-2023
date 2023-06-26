/**
 * This module contains the routes under /mats
 */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const matColors = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/mat-colors.json')));
const mats = matColors.map(x => ({ color: x.id, label: x.label, hex: x.color }));

const routes = express.Router();

routes.get('/', (req, res) => {
  res.send(mats);
});

module.exports = routes;
