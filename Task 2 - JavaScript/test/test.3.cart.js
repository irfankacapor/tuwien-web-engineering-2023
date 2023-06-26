import { test_, gotoPage, expectElementProperty, expectText, clickElement } from './jest-tuwien';
import { testValidHtml } from './jest-tuwien/validate';
import { ordinal, rows, xrand, stringifyRand } from './jest-tuwien/pretty';
import { startInterceptingRequests, expectMetObjectsOnPage, expectMetObjectCache, expectCartItemCount, setCart } from './util';
import { cartDescription } from './obf';
import { calculatePrice } from '../www/frame.js';

const PAGE_URL = 'http://localhost:4444/cart.html';

async function testRemoveItem(steps, cart, objects, n) {
  const selector = `#cart > div:nth-child(${n}) .cart-remove`;
  const selectorStr = `#cart &gt; div:nth-child(${xrand(n)}) .cart-remove`;
  await clickElement(steps, selector, { selectorStr });

  const removedItem = cart[cart.length - n];
  const removedObject = objects.filter(x => x.objectID == removedItem.objectID)[0];
  const expectedCart = cart.filter(x => x.objectID != removedItem.objectID);
  const expectedObjects = objects.filter(x => x.objectID != removedItem.objectID);

  steps.push(
    `expect cart to have been updated`,
    `The following item should no longer be in the cart:<pre>${stringifyRand(removedItem)}</pre>`
  );
  const actualCart = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('cart'));
  });
  try {
    expect(actualCart).toEqual(expectedCart);
  } catch (e) {
    throw Error(
      'Expected cart: ' + JSON.stringify(expectedCart, null, 2) +
      '\n\nActual cart: ' + JSON.stringify(actualCart, null, 2)
    );
  }

  steps.push(
    `expect page to have been updated`,
    `The following object should no longer be shown on the page:<pre>${stringifyRand(removedObject)}</pre>`
  );
  await expect(page).not.toMatch(removedObject.title);

  await expectElementProperty(steps, 'nav > a[href="cart.html"]', 'innerText',
    `Cart (${expectedCart.length})`, { valueStr: `Cart (${xrand(expectedCart.length)})` }
  );

  return [ expectedCart, expectedObjects ]
}

describe('Cart', () => {
  testValidHtml(301, '../www/cart.html');
});

describe('Cart', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    await page.setViewport({ width: 1024, height: 768 });
  });

  test_(302, 'Show empty state', async (steps) => {
    await startInterceptingRequests(steps);
    await gotoPage(steps, PAGE_URL);

    steps.push(`expect page to contain correct text for empty state`);
    await expectText('There are no items in your shopping cart.');

    steps.push(`expect <code>#cart-checkout</code> to be hidden`);
    await page.waitForSelector('#cart-checkout', { hidden: true, timeout: 1000 });

    steps.push(`expect <code>#cart-total</code> to be hidden`);
    await page.waitForSelector('#cart-total', { hidden: true, timeout: 1000 });
  });

  test_(303, 'Show artwork and description for each item', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 3, 5);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);
    await expectMetObjectsOnPage(steps, objects);
  });

  test_(304, 'Show textual frame description for each item', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 3, 5);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      steps.push(
        `expect page to contain the textual frame description for the ${ordinal(i + 1)} item in the shopping cart`,
        `<pre>${stringifyRand(item)}</pre>`
      );
      await expectText(cartDescription(item))
    }
  });

  test_(305, 'Calculate price for each item', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 3, 5);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      steps.push(
        `expect page to contain the price of the ${ordinal(i + 1)} item in the shopping cart`,
        `<pre>${stringifyRand(cart[i])}</pre>`
      );
      const price = calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
      await expectText('€ ' + (price / 100).toFixed(2));
    }
  });

  test_(306, 'Link to framing page for each item', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 3, 5);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);

    const hrefs = await page.evaluate(() => {
      return Array.from(document.getElementsByTagName('a')).map(a => a.getAttribute('href'));
    });

    let normalizedLinks = hrefs.map(href => {
      const xs = href.split("?");
      if (xs.length != 2) {
        return href;
      } else {
        let params = new URLSearchParams(xs[1]);
        params.sort();
        return xs[0] + '?' + params.toString();
      }
    });

    for (let i = 0; i < cart.length; i++) {
      steps.push(
        `expect ${ordinal(i + 1)} cart item on the page to link to the correct framing page`,
        `<pre>${stringifyRand(cart[i])}</pre>`
      );

      let params = new URLSearchParams(cart[i]);
      let expectedHref = 'framing.html?' + params.toString();
      params.sort();
      let expectedNormLink = 'framing.html?' + params.toString();

      try {
        expect(normalizedLinks).toContain(expectedNormLink);
      } catch (e) {
        throw Error(
          'Expected to find a link to:\n' + rows([expectedHref]) + '\n\n' +
          'Actual links found on page:\n' + rows(hrefs) + '\n\n' +
          '(The order of query parameters does not matter.)'
        )
      }
    }
  });

  test_(307, 'Calculate total price', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 3, 5);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);

    steps.push(`expect to find the correct total price on the page`);
    let expectedTotal = 0;
    for (const item of cart) {
      expectedTotal += calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
    }
    await expectText('Total: € ' + (expectedTotal / 100).toFixed(2));
  });

  test_(308, 'Remove one item via button', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 3, 5);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);

    const n = chance.integer({ min: 1, max: cart.length });
    await testRemoveItem(steps, cart, objects, n)
  });

  test_(309, 'Remove one item via button and show correct total price', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 3, 5);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await setCart(steps, cart);
    await gotoPage(steps, PAGE_URL);

    const n = chance.integer({ min: 1, max: cart.length });
    await testRemoveItem(steps, cart, objects, n)

    const updatedCart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('cart'));
    });

    steps.push(`expect to find the correct total price on the page`);
    let expectedTotal = 0;
    for (const item of updatedCart) {
      expectedTotal += calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
    }
    await expectText('Total: € ' + (expectedTotal / 100).toFixed(2));
  });

  test_(310, 'Remove two items via button', async (steps, chance) => {
    const objects1 = chance.nn(chance.metObject, 3, 5);
    const cart1 = objects1.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects1);
    await setCart(steps, cart1);
    await gotoPage(steps, PAGE_URL);

    const n1 = chance.integer({ min: 1, max: cart1.length });
    const [ cart2, objects2 ] = await testRemoveItem(steps, cart1, objects1, n1);

    const n2 = chance.integer({ min: 1, max: cart2.length });
    await testRemoveItem(steps, cart2, objects2, n2);
  });

  test_(311, 'Cache Met objects', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 1, 3);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    const objectIDs = objects.map(x => x.objectID);
    await expectMetObjectCache(steps, objectIDs, async () => {
      await setCart(steps, cart);
      await gotoPage(steps, PAGE_URL);
    });
  });

  test_(312, 'Show number of items in cart', async (steps, chance) => {
    const objects = chance.nn(chance.metObject, 1, 10);
    const cart = objects.map(obj => chance.cartItem({ objectID: obj.objectID }));
    await startInterceptingRequests(steps, objects);
    await expectCartItemCount(steps, cart, async () => {
      await gotoPage(steps, PAGE_URL);
    })
  });

});