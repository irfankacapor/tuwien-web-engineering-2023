import { test_, sendHttpRequest, expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { rows, stringify, xrand, xuser } from './jest-tuwien/pretty';
import cookie from 'cookie';
import { calculatePrice } from '../server/utils/price';

export function testApp(testId, name, fn) {
  test_(testId, name, async (steps, chance) => {
    const artmartBaseUrl = 'https://' + chance.domain({ tld: 'test' });
    const blingApiKey = 'ak_' + chance.nanoid();
    steps.push(
      'start app server',
      `<pre>` +
      `process.env.ARTMART_BASE_URL = '<x-rand>${artmartBaseUrl}</x-rand>';\n` +
      `process.env.BLING_API_KEY = '<x-rand>${blingApiKey}</x-rand>';\n` +
      `\n` +
      `const app = require('./app');\n` +
      `app.listen(0);` +
      '</pre>'
    )
    let app;
    jest.isolateModules(() => {
      process.env.ARTMART_BASE_URL = artmartBaseUrl;
      process.env.BLING_API_KEY = blingApiKey;
      app = require('../server/app');
    });
    const server = app.listen(0)
    try {
      steps.port = server.address().port;
      await fn(steps, chance);
    } finally {
      server.close();
    }
  });
}

export function sendRequest(steps, opts) {
  return sendHttpRequest(steps, { port: steps.port, ...opts });
}

export function expectSessionCookie(steps, res) {
  steps.push('expect response to contain session cookie');
  const cookies = Array.from(res.headers['set-cookie']);
  let sid = null;
  for (let c of cookies) {
    sid = cookie.parse(c)['sessionId'];
    if (sid != null) break;
  }
  if (sid == null) {
    throw Error(
      'Expected to find sessionId cookie.\n\n' +
      'Received Set-Cookie headers:\n' + rows(cookies.map(x => 'Set-Cookie: ' + x), 2)
    )
  }
  return sid;
}

export async function createNewCart(steps) {
  steps.beginGroup('create new cart');
  const res = await sendRequest(steps, { path: '/cart' });
  expectStatus(steps, res, 200);
  const sid = expectSessionCookie(steps, res);
  const cart = expectBodyJSON(steps, res);
  steps.push('expect JSON payload to be an empty cart');
  expectEquality(cart, []);  
  steps.endGroup()
  return sid;
}

export async function getCart(steps, sid) {
  steps.beginGroup('get cart');
  const res = await sendRequest(steps, {
    path: '/cart',
    cookie: 'sessionId=' + sid,
    cookieStr: 'sessionId=' + xuser(sid)
  });
  expectStatus(steps, res, 200);
  const cart = expectBodyJSON(steps, res);
  steps.endGroup();
  return cart;
}

export async function addCartItem(steps, sid, item, { rand = false } = {}) {
  steps.beginGroup('add item to cart');
  const res = await sendRequest(steps, {
    method: 'POST',
    path: '/cart',
    cookie: 'sessionId=' + sid,
    cookieStr: 'sessionId=' + xuser(sid),
    jsonBody: item,
    jsonBodyStr: stringify(item, { mark: (x) => rand ? xrand(x) : x })
  });
  expectStatus(steps, res, 201);
  steps.endGroup();
}

export async function addRandomCartItem(steps, chance, sid) {
  const item = chance.cartItemWithoutId();
  await addCartItem(steps, sid, item, { rand: true });
  return item;
}

export async function createRandomCart(steps, chance) {
  const sid = await createNewCart(steps);
  const n = chance.integer({ min: 1, max: 5 });
  let cart = [];
  let subtotal = 0;
  for (let i = 0; i < n; i++) {
    const item = await addRandomCartItem(steps, chance, sid);
    cart.push(item);
    subtotal += calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
  }
  return { sid, cart, subtotal }
}
