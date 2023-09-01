import { test_, expectText, getElement } from './jest-tuwien';
import { describe, expect, afterEach, vi } from "vitest"
import { stringify, xrand, xrandkeys, rows } from "./jest-tuwien/pretty";
import { shallowMount, flushPromises } from "@vue/test-utils";
import { createTestingPinia } from '@pinia/testing';
import { useArtmartStore } from "../src/store";
import { fetchMock, fm } from './jest-tuwien/fetch';
import router from '../src/router';

import Checkout from "../src/pages/CheckoutPage.vue";


const BLING_BASE_URL = 'https://web-engineering.big.tuwien.ac.at/s23/bling'

function mountCheckoutPage(steps, chance, { cart = null } = {}) {
  cart = cart ?? chance.cart()
  const destinations = new Map();
  for (const destination of chance.nn(chance.shippingDestination, 3, 5)) {
    destinations.set(destination.isoCode, destination);
  }

  const pinia = createTestingPinia({
    // Replace every action with a spy that always returns true
    createSpy: () => vi.fn(() => Promise.resolve(true))
  });
  const store = useArtmartStore();
  store.cart = cart;
  store.destinations = destinations;
  const stateStr = stringify(store.$state, { mark: xrand, inspect: true });
  steps.push(
    `mount the <code>Checkout</code> page with stubbed child components and a mock store`,
    `The mocked store contains the following initial state: <pre>${stateStr}</pre>`
  );
  const wrapper = shallowMount(Checkout, {
    global: {
      plugins: [
        pinia,
        router
      ],
    }
  });

  return { wrapper, store };
}

function fillForm(steps, chance, wrapper, store) {
  const customer = chance.customer();
  customer.shipping_address.country = chance.pickone(store.sortedDestinations).country;
  const card = chance.creditCard();
  const fillings = [
    ['#email', customer.email],
    ['#name', customer.shipping_address.name],
    ['#address', customer.shipping_address.address],
    ['#city', customer.shipping_address.city],
    ['#country', customer.shipping_address.country, 'change'],
    ['#postalcode', customer.shipping_address.postal_code],
    ['#phone', customer.shipping_address.phone ?? ""],
    ['#cardholder', card.cardholder],
    ['#cardnumber', card.cardnumber],
    ['#cardexpiry', String(card.exp_month).padStart(2, 0) + '/' + String(card.exp_year).padStart(2, 0)],
    ['#cardcvc', card.cvc]
  ]
  let fillingsTable = '<table style="width: auto; margin-top: 1em;">';
  for (let filling of fillings) {
    fillingsTable += '<tr>';
    fillingsTable += '<td style="padding: 0.5em 1em;"><code>' + filling[0] + '</code></td> ';
    fillingsTable += '<td style="padding: 0.5em 1em;"><x-rand>' + filling[1] + '</x-rand></td>';
    fillingsTable += '</tr>\n';
  }
  fillingsTable += '</table>'

  steps.push(
    'fill out form with random data', `${fillingsTable}`
  )
  for (let filling of fillings) {
    const elem = getElement(wrapper, filling[0]);
    elem.element.value = filling[1];
    elem.trigger(filling[2] ?? 'input');
  }
  return { customer, card }
}

function mockCheckout(steps, chance, customer) {
  const checkoutRequest = {
    email: customer.email,
    shipping_address: { phone: '', ...customer.shipping_address }
  };
  const checkoutResponse = {
    payment_intent_id: chance.blingPaymentIntentId(),
    client_secret: chance.blingClientSecret(),
    amount: chance.integer({ min: 100, max: 200000 }),
    currency: 'eur'
  }

  const checkoutResponseStr = stringify(checkoutResponse, { mark: xrandkeys(['currency'], false) });
  steps.push(
    'start intercepting requests to the Artmart API',
    `The first <code>POST</code> request to <code>/cart/checkout</code> ` +
    `will return <code>200 OK</code> ` +
    `with the following JSON payload:\n<pre>${checkoutResponseStr}</pre>`
  )
  fetchMock.mockOnceIf(fm.and(fm.isHttpPost, fm.urlIncludes(`/cart/checkout`)), fm.respondJson(checkoutResponse));


  return { checkoutRequest, checkoutResponse }
}

function mockPayment(steps, chance, card, checkoutResponse, status = 'succeeded') {
  const blingEndpoint = BLING_BASE_URL + '/payment_intents/' + checkoutResponse.payment_intent_id + '/confirm';
  const blingRequest = { client_secret: checkoutResponse.client_secret, ...card };
  const blingResponse = {
    id: checkoutResponse.payment_intent_id,
    client_secret: checkoutResponse.client_secret,
    amount: checkoutResponse.amount,
    currency: 'eur',
    created_at: new Date(),
    status: status,
    card: {
      cardholder: card.cardholder,
      last4: card.cardnumber.slice(-4),
      exp_month: card.exp_month,
      exp_year: card.exp_year
    }
  }
  if (status == 'failed') {
    blingResponse.payment_error = chance.pickone(['card_expired', 'card_declined']);
  }

  const blingEndpointStr = BLING_BASE_URL + '/payment_intents/' + xrand(checkoutResponse.payment_intent_id) + '/confirm';
  const blingResponseStr = stringify(blingResponse, { mark: xrandkeys(['currency', 'created_at', 'status'], false) })
  steps.push(
    'start intercepting requests to the Bling API',
    `The first <code>POST</code> request to <code>${blingEndpointStr}</code> ` +
    `will return <code>${status == 'failed' ? '402 Payment Required' : '200 OK'}</code> ` +
    `with the following JSON payload:\n<pre>${blingResponseStr}</pre>`
  )
  fetchMock.mockOnceIf(fm.and(fm.isHttpPost, fm.urlIncludes(blingEndpoint)), fm.respondJson(blingResponse, status == 'failed' ? 402 : 200));

  return { blingEndpoint, blingRequest, blingResponse }
}

async function submitForm(steps, wrapper) {
  steps.push('submit form')
  await getElement(wrapper, '#checkout-form').trigger('submit');
  await flushPromises()
}

function expectPostRequest(url) {
  const postReqs = fm.requests(fetchMock).filter(v => v.method === "POST").map(v => v.url);
  try {
    if (url instanceof RegExp) {
      expect(postReqs.some(v => url.test(v))).toBeTruthy();
    } else {
      expect(postReqs.some(v => v.includes(url))).toBeTruthy();
    }
  } catch (e) {
    let urlStr = 'to ' + url;
    if (url instanceof RegExp) {
      urlStr = 'matching the regular expression ' + url.source;
    }
    throw Error(
      `Expected a POST request ${urlStr}\n\n` +
      `The following POST requests were intercepted:\n` + rows(postReqs)
    )
  }
}

function expectPayload(url, payload, expectedPayload) {
  try {
    expect(payload).toEqual(expectedPayload);
  } catch (e) {
    throw Error(
      `The payload sent to ${url} was incorrect.\n\n` +
      `Expected payload:\n  ${stringify(expectedPayload, { margin: 2 })}\n\n` +
      `Intercepted payload:\n  ${stringify(payload, { margin: 2 })}`
    )
  }
}

function expectTotalNumberOfRequests(steps, n) {
  steps.push('expect no further requests')
  if (fm.requests(fetchMock).length > n) {
    throw Error('There were more requests than expected:\n' + JSON.stringify(fetchMock.calls(), null, 2))
  }
}

describe('Checkout', () => {

  afterEach(() => {
    fetchMock.mockReset();
  });

  test_(501, 'Empty cart redirect', async (steps, chance) => {
    const { wrapper } = mountCheckoutPage(steps, chance, { cart: [] })
    steps.push('wait for redirect to <code>/cart</code>');
    await router.isReady()
    try {
      expect(wrapper.vm.$route.path).toBe('/cart');
    } catch (e) {
      throw Error(
        'Expected path of current route: /cart\n' +
        'Actual path of current route: ' + wrapper.vm.$route.path
      );
    }
  });

  test_(502, 'Subtotal', (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance)
    const expectedSubtotal = (store.cartTotal / 100).toFixed(2);
    steps.push('expect page to show correct subtotal');
    const subtotalElem = getElement(wrapper, '#price-subtotal');
    expectText(subtotalElem, expectedSubtotal);
  });

  test_(503, 'Shipping costs', async (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance);
    const cartTotal = store.cartTotal;

    for (const destination of store.sortedDestinations) {
      const expectedCost = destination.freeShippingPossible && cartTotal >= destination.freeShippingThreshold
        ? 'Free'
        : `€ ${(destination.price / 100).toFixed(2)}`;
      steps.push(`select ${xrand(destination.displayName)} and expect the displayed shipping costs to be € ${xrand(expectedCost)}`)
      const countryDropdown = getElement(wrapper, '#country')
      countryDropdown.element.value = destination.isoCode;
      await countryDropdown.trigger('change');
      const priceElem = getElement(wrapper, '#price-shipping');
      expectText(priceElem, expectedCost);
    }
  });

  test_(504, 'Total price', async (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance);
    const cartTotal = store.cartTotal;

    for (const destination of store.sortedDestinations) {
      const expectedShippingCost = destination.freeShippingPossible && cartTotal >= destination.freeShippingThreshold
        ? 0
        : destination.price;

      const expectedTotal = ((cartTotal + expectedShippingCost) / 100).toFixed(2);
      steps.push(`select ${xrand(destination.displayName)} and expect the displayed total price to be € ${xrand(expectedTotal)}`)
      const countryDropdown = getElement(wrapper, '#country')
      countryDropdown.element.value = destination.isoCode;
      await countryDropdown.trigger('change');
      const priceElem = getElement(wrapper, '#price-total');
      expectText(priceElem, expectedTotal);
    }
  });

  test_(505, 'Successful payment', async (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance)
    const { customer, card } = fillForm(steps, chance, wrapper, store);

    const { checkoutRequest, checkoutResponse } = mockCheckout(steps, chance, customer);
    const { blingEndpoint, blingRequest } = mockPayment(steps, chance, card, checkoutResponse);
    fetchMock.mockResponse(() => ({ status: 501 }));

    await submitForm(steps, wrapper);

    steps.push('expect request to Artmart with correct payload');
    expectPostRequest(/\/cart\/checkout/)
    const userPayload1 = await fm.getJson(fm.requests(fetchMock)[0]);
    expectPayload('Artmart', userPayload1, checkoutRequest);

    steps.push('expect request to Bling with correct payload')
    expectPostRequest(blingEndpoint)
    const userPayload2 = await fm.getJson(fm.requests(fetchMock)[1]);
    expectPayload(blingEndpoint, userPayload2, blingRequest)

    expectTotalNumberOfRequests(steps, 2);

    steps.push('expect success message to be shown');
    // The wrapper text can have a space in the middle, so we check them individually
    expectText(wrapper, 'Your payment was completed successfully.', false)
    expectText(wrapper, 'Thank you for your purchase!', false)
  });

  test_(506, 'Failed payment (1)', async (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance)
    fillForm(steps, chance, wrapper, store);

    steps.push(
      'start intercepting requests to the Artmart API',
      `The first <code>POST</code> request to <code>/cart/checkout</code> ` +
      `will return <code>400 Bad Request</code>.`
    )
    fetchMock.mockOnceIf(fm.and(fm.isHttpPost, fm.urlIncludes(`/cart/checkout`)), fm.respondStatus(400));
    fetchMock.mockResponse(() => ({ status: 501 }));

    await submitForm(steps, wrapper);

    steps.push('expect request to Artmart');
    expectPostRequest(/\/cart\/checkout/)
    expectTotalNumberOfRequests(steps, 1);

    steps.push('expect error message to be shown');
    expectText(wrapper, 'An error occurred during payment. Please try again.', false)
  });

  test_(507, 'Failed payment (2)', async (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance)
    const { customer, card } = fillForm(steps, chance, wrapper, store);

    const { checkoutRequest, checkoutResponse } = mockCheckout(steps, chance, customer);
    const { blingEndpoint, blingRequest } = mockPayment(steps, chance, card, checkoutResponse, 'failed');
    fetchMock.mockResponse(() => ({ status: 501 }));

    await submitForm(steps, wrapper);

    steps.push('expect request to Artmart with correct payload');
    expectPostRequest(/\/cart\/checkout/)
    const userPayload1 = await fm.getJson(fm.requests(fetchMock)[0]);
    expectPayload('Artmart', userPayload1, checkoutRequest);

    steps.push('expect request to Bling with correct payload')
    expectPostRequest(blingEndpoint)
    const userPayload2 = await fm.getJson(fm.requests(fetchMock)[1]);
    expectPayload(blingEndpoint, userPayload2, blingRequest)

    expectTotalNumberOfRequests(steps, 2);

    steps.push('expect error message to be shown');
    expectText(wrapper, 'An error occurred during payment. Please try again.', false)
  });

  test_(508, 'Payment in progress (1)', async (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance)
    fillForm(steps, chance, wrapper, store);

    steps.push(
      'start intercepting requests to the Artmart API',
      `The first <code>POST</code> request to <code>/cart/checkout</code> ` +
      `will take 10 seconds to return <code>400 Bad Request</code>.`
    )
    fetchMock.mockOnceIf(fm.and(fm.isHttpPost, fm.urlIncludes(`/cart/checkout`)), async () => {
      await fm.delay(10000);
      return fm.respondStatus(400);
    });

    fetchMock.mockResponse(() => ({ status: 501 }));

    await submitForm(steps, wrapper);

    steps.push('expect processing message to be shown')
    expectText(wrapper, 'Processing payment...', false)

    wrapper.unmount();
  });

  test_(509, 'Payment in progress (2)', async (steps, chance) => {
    const { wrapper, store } = mountCheckoutPage(steps, chance)
    const { customer } = fillForm(steps, chance, wrapper, store);

    const { checkoutResponse } = mockCheckout(steps, chance, customer);

    const blingEndpoint = BLING_BASE_URL + '/payment_intents/' + checkoutResponse.payment_intent_id + '/confirm';
    const blingEndpointStr = BLING_BASE_URL + '/payment_intents/' + xrand(checkoutResponse.payment_intent_id) + '/confirm';
    steps.push(
      'start intercepting requests to the Bling API',
      `The first <code>POST</code> request to <code>${blingEndpointStr}</code> ` +
      `will take 10 seconds to return <code>402 Payment Required</code>.`
    )
    fetchMock.mockOnceIf(fm.and(fm.isHttpPost, fm.urlIncludes(blingEndpoint)), async () => {
      await fm.delay(10000);
      return fm.respondStatus(402);
    });
    fetchMock.mockResponse(() => ({ status: 501 }));

    await submitForm(steps, wrapper);

    steps.push('expect processing message to be shown')
    expectText(wrapper, 'Processing payment...', false)

    wrapper.unmount();
  });

});