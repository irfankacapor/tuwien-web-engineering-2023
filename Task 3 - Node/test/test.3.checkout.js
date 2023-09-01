import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest, createRandomCart, createNewCart, getCart } from './util';
import { calculatePrice } from '../server/utils/price.js';
import { rows, xrand, stringify, xuser, escapeHtml } from './jest-tuwien/pretty';
const fs = require('fs');
const path = require('path');

const BLING_BASE_URL = 'https://web-engineering.big.tuwien.ac.at/s23/bling'

//----------------------------------------------------------------------------

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox())
const fetchMock = require('node-fetch')

const blingPaymentIntents = new Map();

function startFetchMock(steps, chance) {
  steps.push(
    'start intercepting requests to the Bling API',
    '<ul>' +
    '<li>All requests to relevant parts of the Bling API will return internally consistent mock responses.</li>\n' +
    '<li>All other requests will result in a response of <code>501 Not Implemented</code>.</li>' +
    '</ul>'
  );

  fetchMock.post(`${BLING_BASE_URL}/payment_intents`, (url, opts) => {
    const authHeader = 'Basic ' + btoa(process.env.BLING_API_KEY + ':');
    if (!opts.headers || opts.headers['Authorization'] != authHeader) {
      return { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Bling API"' } };
    }
    try { opts.body = JSON.parse(opts.body); } catch (e) { return 400; }
    if (!opts.body.amount || isNaN(opts.body.amount)) { return 400; }
    if (opts.body.currency != 'eur') { return 400; }
    const payment_intent = {
      id: chance.blingPaymentIntentId(),
      created_at: new Date(),
      amount: parseInt(opts.body.amount),
      currency: opts.body.currency,
      client_secret: chance.blingClientSecret(),
      webhook: opts.body.webhook,
      status: 'created'
    }
    blingPaymentIntents.set(payment_intent.id, payment_intent);
    return payment_intent;
  });

  fetchMock.get(`glob:${BLING_BASE_URL}/payment_intents/*`, (url, opts) => {
    const authHeader = 'Basic ' + btoa(process.env.BLING_API_KEY + ':');
    if (!opts.headers || opts.headers['Authorization'] != authHeader) {
      return { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Bling API"' } };
    }
    const pid = url.substring(url.lastIndexOf('/') + 1);
    const payment_intent = blingPaymentIntents.get(pid);
    return payment_intent ? payment_intent : 404;
  });

  fetchMock.any(() => {
    return 501;
  })
}

function resetFetchMock() {
  blingPaymentIntents.clear();
  fetchMock.reset();
}

function getLastBlingPaymentIntent(steps) {
  if (blingPaymentIntents.size == 0) {
    let calls = fetchMock.calls();
    throw Error(
      'No payment intent was created on the (mock) Bling server, probably because of an incorrect request to the Bling API.' +
      '\n\nThe following requests were detected:\n' + (calls.length == 0 ? '  (none)' : stringify(calls))
    )
  } else {
    return Array.from(blingPaymentIntents)[blingPaymentIntents.size - 1][1];
  }
}

function confirmBlingPaymentIntent(pid, card, success) {
  const payment_intent = blingPaymentIntents.get(pid);
  if (!payment_intent) {
    throw Error(`Payment intent with ID ${pid} not found on the (mock) Bling server.`)
  }
  payment_intent.status = success ? 'succeeded' : 'failed';
  if (!success) { payment_intent.payment_error = 'card_declined'; }
  payment_intent.card = {
    cardholder: card.cardholder,
    last4: card.cardnumber.slice(-4),
    exp_month: card.exp_month,
    exp_year: card.exp_year
  }
  blingPaymentIntents.set(pid, payment_intent);
  return payment_intent;
}

//----------------------------------------------------------------------------

async function initiateCheckout(steps, chance, sid) {
  steps.beginGroup('initiate checkout');
  const customerInfo = {
    email: chance.email({ domain: 'example.com' }),
    shipping_address: chance.shippingAddress()
  }
  const res = await sendRequest(steps, {
    method: 'POST',
    path: '/cart/checkout',
    cookie: 'sessionId=' + sid,
    cookieStr: 'sessionId=' + xuser(sid),
    jsonBody: customerInfo,
    jsonBodyStr: stringify(customerInfo, { mark: xrand })
  })
  expectStatus(steps, res, 200);
  const body = expectBodyJSON(steps, res);
  steps.push('expect a Bling payment intent to have been created')
  const payment_intent = getLastBlingPaymentIntent();
  const payment_intent_str = stringify(payment_intent, {
    mark: (v, k) => {
      if (['id', 'client_secret'].includes(k)) {
        return xrand(v);
      } else if (['amount', 'currency', 'webhook'].includes(k)) {
        return xuser(v);
      } else {
        return escapeHtml(String(v));
      }
    }
  });
  steps.push(
    'expect response to match the corresponding Bling payment intent',
    `The payment intent object returned by the (mock) Bling API was ` +
    `<pre>${payment_intent_str}</pre>`
  )
  expectEquality(body, {
    payment_intent_id: payment_intent.id,
    client_secret: payment_intent.client_secret,
    amount: payment_intent.amount,
    currency: payment_intent.currency
  });
  steps.endGroup();
  return { payment_intent, customerInfo };
}

async function simulatePayment(steps, chance, payment_intent, success) {
  const card = chance.creditCard()
  const clientBody = { client_secret: payment_intent.client_secret, ...card };
  const clientBodyStr = stringify(clientBody, { mark: xrand });
  steps.beginGroup(
    `simulate a ${success ? 'successful' : 'failed'} payment`,
    `A (simulated) client has sent a <code>POST</code> request to the (mock) Bling server endpoint ` +
    `<code>/payment_intents/${xrand(payment_intent.id)}/confirm</code>` +
    ` with the following payload: <pre>${clientBodyStr}</pre>` +
    `Bling will ${success ? 'accept' : 'decline'} the payment and send an event to the corresponding webhook.`
  );
  payment_intent = confirmBlingPaymentIntent(payment_intent.id, card, success);
  const blingEvent = {
    id: chance.blingEventId(),
    created_at: new Date(),
    type: 'payment.' + payment_intent.status,
    payment_intent: payment_intent
  }
  const blingEventStr = stringify(blingEvent, {
    mark: (v, k) => {
      if (['id', 'payment_intent.id', 'payment_intent.client_secret'].includes(k)) {
        return xrand(v);
      } else if (k.startsWith('payment_intent.card.')) {
        return xrand(v);
      } else if (['payment_intent.amount', 'payment_intent.currency', 'payment_intent.webhook'].includes(k)) {
        return xuser(v);
      } else {
        return escapeHtml(String(v));
      }
    }
  });
  const res = await sendRequest(steps, {
    method: 'POST',
    path: '/cart/checkout/payment-update',
    jsonBody: blingEvent,
    jsonBodyStr: blingEventStr
  });
  expectStatus(steps, res, 204);
  steps.endGroup();
  return payment_intent;
}

//----------------------------------------------------------------------------

describe('/cart/checkout', () => {

  afterEach(() => {
    resetFetchMock();
  });

  testApp(301, 'Create payment intent', async (steps, chance) => {
    startFetchMock(steps, chance);
    const { sid } = await createRandomCart(steps, chance);
    await initiateCheckout(steps, chance, sid);
  });

  testApp(302, 'Missing session for checkout', async (steps, chance) => {
    startFetchMock(steps, chance);
    const res = await sendRequest(steps, { method: 'POST', path: '/cart/checkout' });
    expectStatus(steps, res, 403);
  });

  testApp(303, 'Invalid session for checkout', async (steps, chance) => {
    startFetchMock(steps, chance);
    const sid = chance.nanoid();
    const res = await sendRequest(steps, {
      method: 'POST',
      path: '/cart/checkout',
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xrand(sid),
    });
    expectStatus(steps, res, 403);
  });

  testApp(304, 'Checkout with empty cart', async (steps, chance) => {
    startFetchMock(steps, chance);
    const sid = await createNewCart(steps);
    const res = await sendRequest(steps, {
      method: 'POST',
      path: '/cart/checkout',
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid)
    });
    expectStatus(steps, res, 400)
  });

  testApp(305, 'Invalid customer information', async (steps, chance) => {
    startFetchMock(steps, chance);
    const { sid } = await createRandomCart(steps, chance);
    const customerInfo = chance.pickone([
      { email: chance.email({ domain: 'example.com' }) },
      { shipping_address: chance.shippingAddress() },
      {
        email: chance.email({ domain: 'example.com' }),
        shipping_address: { name: chance.name(), phone: chance.phone() }
      }
    ]);
    const res = await sendRequest(steps, {
      method: 'POST',
      path: '/cart/checkout',
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid),
      jsonBody: customerInfo,
      jsonBodyStr: stringify(customerInfo, { mark: xrand })
    });
    expectStatus(steps, res, 400)
  });

  testApp(306, 'Order receipt', async (steps, chance) => {
    startFetchMock(steps, chance);
    const { sid, cart } = await createRandomCart(steps, chance);
    let { payment_intent, customerInfo } = await initiateCheckout(steps, chance, sid);

    steps.push('inspect <code>orders</code> directory')
    const outputDir = path.join(__dirname, '../server/orders');
    const orderFiles1 = fs.readdirSync(outputDir).sort();

    payment_intent = await simulatePayment(steps, chance, payment_intent, true);

    steps.push('expect correct order receipt to have been created');
    const orderFiles2 = fs.readdirSync(outputDir).sort();
    if (orderFiles2.length != orderFiles1.length + 1) {
      const diff = Array.from(orderFiles2.filter(x => !orderFiles1.includes(x)));
      throw Error(
        'Expected creation of exactly one order receipt.\n\n' +
        'Actual files created:\n' + rows(diff)
      );
    }
    const lastFile = orderFiles2.pop();
    const order = JSON.parse(fs.readFileSync(path.join(outputDir, lastFile)));
    expectEquality(order, {
      order_date: expect.any(String),
      email: customerInfo.email,
      shipping_address: customerInfo.shipping_address,
      card: payment_intent.card,
      amount: payment_intent.amount,
      currency: 'eur',
      cart: cart.map(item => ({
        ...item,
        price: calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth)
      }))
    });

  });

  testApp(307, 'Clear cart after checkout', async (steps, chance) => {
    startFetchMock(steps, chance);
    const { sid } = await createRandomCart(steps, chance);
    let { payment_intent } = await initiateCheckout(steps, chance, sid);
    payment_intent = await simulatePayment(steps, chance, payment_intent, true);
    const cart = await getCart(steps, sid);
    steps.push('expect cart to be empty')
    expectEquality(cart, []);
  });

  testApp(308, 'Failed payment', async (steps, chance) => {
    startFetchMock(steps, chance);
    const { sid } = await createRandomCart(steps, chance);
    const cart = await getCart(steps, sid);
    let { payment_intent } = await initiateCheckout(steps, chance, sid);

    steps.push('inspect <code>orders</code> directory')
    const outputDir = path.join(__dirname, '../server/orders');
    const orderFiles1 = fs.readdirSync(outputDir).sort();

    payment_intent = await simulatePayment(steps, chance, payment_intent, false);

    steps.push('expect no receipts to have been created');
    const orderFiles2 = fs.readdirSync(outputDir).sort();
    if (orderFiles2.length != orderFiles1.length) {
      const diff = Array.from(orderFiles2.filter(x => !orderFiles1.includes(x)));
      throw Error(
        'Expected creation of exactly zero order receipts.\n\n' +
        'Actual files created:\n' + rows(diff)
      );
    }

    const cart2 = await getCart(steps, sid);
    steps.push('expect cart to still contain the same items');
    expectEquality(new Set(cart2), new Set(cart));
  });

  testApp(309, 'Illegitimate webhook request', async (steps, chance) => {
    startFetchMock(steps, chance);
    const status = chance.pickone(['succeeded', 'failed', 'cancelled']);
    const created_at = chance.date({ year: 2021, month: 5 });
    const blingEvent = {
      id: chance.blingEventId(),
      created_at: created_at,
      type: 'payment.' + status,
      payment_intent: {
        id: chance.blingPaymentIntentId(),
        created_at: created_at,
        amount: chance.natural(),
        currency: 'eur',
        client_secret: chance.blingClientSecret(),
        webhook: 'https://' + chance.word() + '.test/cart/checkout/payment-update',
        status: status
      }
    }
    const res = await sendRequest(steps, {
      method: 'POST',
      path: '/cart/checkout/payment-update',
      jsonBody: blingEvent,
      jsonBodyStr: stringify(blingEvent, { mark: xrand })
    })
    expectStatus(steps, res, 400);
  });

});