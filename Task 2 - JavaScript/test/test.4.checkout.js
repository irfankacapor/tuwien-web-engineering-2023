import { test_, gotoPage, selectOption, expectText } from './jest-tuwien';
import { xrand } from './jest-tuwien/pretty';
import { testValidHtml } from './jest-tuwien/validate';
import { startInterceptingRequests, setCart } from './util';
import { calculatePrice } from '../www/frame.js';

const PAGE_URL = 'http://localhost:4444/checkout.html';
const DESTINATIONS = [
  ['Austria', 1500, true, 10000],
  ['Germany', 1800, true, 15000],
  ['Switzerland', 2500, true, 30000],
  ['United Kingdom', 3000, false],
  ['Netherlands', 2000, true, 15000]
];

describe('Checkout', () => {
  testValidHtml(401, '../www/checkout.html');
});

describe('Checkout', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    await page.setViewport({ width: 1024, height: 768 });
  });

  test_(402, 'Redirect if cart is empty', async (steps) => {
    await startInterceptingRequests(steps);
    await gotoPage(steps, PAGE_URL);
    steps.push('wait for redirect to cart page');
    await page.waitForFunction(() => {
      return document.location.href.includes('cart.html');
    }, { timeout: 1000 });
    expect(page.url()).toEqual(expect.stringMatching(/cart.html/));
  });

  test_(403, 'Calculate subtotal', async (steps, chance) => {
    await startInterceptingRequests(steps);
    const cart = chance.nn(chance.cartItem, 3, 5);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);

    steps.push(`expect to find the correct subtotal on the page`);
    let expectedSubtotal = 0;
    for (const item of cart) {
      expectedSubtotal += calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
    }
    await expectText('Subtotal: € ' + (expectedSubtotal/100).toFixed(2));
  });

  test_(404, 'Calculate shipping costs', async (steps, chance) => {
    await startInterceptingRequests(steps);
    const cart = chance.nn(chance.cartItem, 3, 5);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);

    let expectedSubtotal = 0;
    for (const item of cart) {
      expectedSubtotal += calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
    }

    const dest = chance.pickone(DESTINATIONS);
    await selectOption(steps, 'select[name="country"]', dest[0], { optionStr: xrand })
    steps.push('expect to find the correct shipping costs on the page');

    if(dest[2]) {
      if(expectedSubtotal < dest[3]) {
        await expectText('Shipping Costs: € ' + (dest[1]/100).toFixed(2));
        await expectText('(Free shipping starts from: € ' + (dest[3]/100).toFixed(2));
      }
      else {
        await expectText('Shipping Costs: Free');
      }
    }
    else {
      await expectText('Shipping Costs: € ' + (dest[1]/100).toFixed(2));
    }
    
  });

  test_(405, 'Calculate total', async (steps, chance) => {
    await startInterceptingRequests(steps);
    const cart = chance.nn(chance.cartItem, 3, 5);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);

    let subtotal = 0;
    for (const item of cart) {
      subtotal += calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
    }

    const dest = chance.pickone(DESTINATIONS);
    await selectOption(steps, 'select[name="country"]', dest[0], { optionStr: xrand });

    steps.push(`expect to find the correct total on the page`);
    
    let expectedTotal = subtotal;

    if(!dest[2] || subtotal < dest[3]) {
      expectedTotal += dest[1];
    }

    await expectText('Total: € ' + (expectedTotal/100).toFixed(2));
  });

});
