/**
 * This module contains methods for managing sessions
 * CAVE: This is only an extremely naive implementation, do not use in production!
 */

/**
 * In-memory store for the sessions
 * @type {Map<string, any>} A map using the session id as key
 */
const sessions = new Map();

/**
 * Initialize a new session
 * @return {string} The generated session id
 */
const { nanoid } = require("nanoid");
const Cart = require("./cart");

function create() {
  const sid = nanoid();
  sessions.set(sid, {
    cart: new Cart(),
  });
  return sid;
}

/**
 * Load a session by id
 * @param id {string} The session id
 * @return {any} The session data, or null if the session does not exist
 */
function load(id) {
  return sessions.get(id);
}

/** TODO: Add other methods to operate on session */

module.exports = {create, load}
