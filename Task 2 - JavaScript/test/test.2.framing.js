import { test_, gotoPage, clickElement, fillElement, expectElementProperty, expectText } from './jest-tuwien';
import { testValidHtml } from './jest-tuwien/validate';
import { capitalise, xrand } from './jest-tuwien/pretty';
import { startInterceptingRequests, expectMetObjectsOnPage, expectMetObjectCache, expectCartItemCount } from './util';
import { calculatePrice } from '../www/frame.js';

const PAGE_URL = 'http://localhost:4444/framing.html';

const printSizeLabel = (s) => { return { 'S': 'Small', 'M': 'Medium', 'L': 'Large' }[s]; }
const frameStyleLabel = (s) => capitalise(s);
const matColorLabel = (s) => capitalise(s);

describe('Framing', () => {
  testValidHtml(201, '../www/framing.html');
});

describe('Framing', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    await page.setViewport({ width: 1024, height: 768 });
  });

  test_(202, 'Redirect if object ID is missing', async (steps) => {
    await startInterceptingRequests(steps);
    await gotoPage(steps, PAGE_URL);
    steps.push('wait for redirect to search page');
    await page.waitForFunction(() => {
      return document.location.href.includes('search.html');
    }, { timeout: 1000 });
    expect(page.url()).toEqual(expect.stringMatching(/search.html/));
  });

  test_(203, 'Redirect if object does not exist', async (steps, chance) => {
    await startInterceptingRequests(steps);
    await gotoPage(steps, PAGE_URL, { objectID: chance.metObjectID() });
    steps.push('wait for redirect to search page');
    await page.waitForFunction(() => {
      return document.location.href.includes('search.html');
    }, { timeout: 1000 });
    expect(page.url()).toEqual(expect.stringMatching(/search.html/));
  });

  test_(204, 'Show artwork and description', async (steps, chance) => {
    const object = chance.metObject();
    await startInterceptingRequests(steps, [object]);
    await gotoPage(steps, PAGE_URL, { objectID: object.objectID });
    await expectMetObjectsOnPage(steps, [object]);
  });

  test_(205, 'Set controls via query parameters', async (steps, chance) => {
    const object = chance.metObject();
    await startInterceptingRequests(steps, [object])
    const printSize = chance.printSize();
    const frameWidth = chance.frameWidth();
    const frameStyle = chance.frameStyle();
    const matWidth = chance.matWidth();
    const matColor = chance.matColor();
    await gotoPage(steps, PAGE_URL, { objectID: object.objectID, printSize, frameWidth, frameStyle, matWidth, matColor });
    await expectElementProperty(steps, 'input[name=printSize]:checked', 'value', printSize, { valueStr: xrand });
    await expectElementProperty(steps, 'input[name=frameWidth]', 'value', frameWidth / 10, { valueStr: xrand });
    await expectElementProperty(steps, 'input[name=frameStyle]:checked', 'value', frameStyle, { valueStr: xrand });
    await expectElementProperty(steps, 'input[name=matWidth]', 'value', matWidth / 10, { valueStr: xrand });
    await expectElementProperty(steps, 'input[name=matColor]:checked', 'value', matColor, { valueStr: xrand });
  });

  test_(206, 'Calculate price when controls are set via query parameters', async (steps, chance) => {
    const object = chance.metObject();
    await startInterceptingRequests(steps, [object])
    const printSize = chance.printSize();
    const frameWidth = chance.frameWidth();
    const frameStyle = chance.frameStyle();
    const matWidth = chance.matWidth();
    const matColor = chance.matColor();
    await gotoPage(steps, PAGE_URL, { objectID: object.objectID, printSize, frameWidth, frameStyle, matWidth, matColor });    
    steps.push(`expect to find correct price on page`);
    const expectedPrice = calculatePrice(printSize, frameStyle, frameWidth, matWidth);
    await expectText('€ ' + (expectedPrice/100).toFixed(2));
  });

  test_(207, 'Update price when controls change', async (steps, chance) => {
    const object = chance.metObject();
    await startInterceptingRequests(steps, [object]);
    await gotoPage(steps, PAGE_URL, { objectID: object.objectID });

    const printSize = chance.printSize();
    const frameWidth = chance.frameWidth();
    const frameStyle = chance.frameStyle();
    const matWidth = chance.matWidth();
    const matColor = chance.matColor();

    await clickElement(steps, 'label', { withText: printSizeLabel(printSize), textStr: xrand })
    await fillElement(steps, 'input[name="frameWidth"]', frameWidth / 10, { valueStr: xrand });
    await clickElement(steps, 'label', { withText: frameStyleLabel(frameStyle), textStr: xrand })
    await fillElement(steps, 'input[name="matWidth"]', matWidth / 10, { valueStr: xrand });
    await clickElement(steps, 'label', { withText: matColorLabel(matColor), textStr: xrand })

    steps.push(`expect to find correct price on page`);
    const expectedPrice = calculatePrice(printSize, frameStyle, frameWidth, matWidth);
    await expectText('€ ' + (expectedPrice/100).toFixed(2));
  });

  test_(208, 'Cache Met objects', async (steps, chance) => {
    const object = chance.metObject();
    await startInterceptingRequests(steps, [object])
    await expectMetObjectCache(steps, [object.objectID], async () => {
      await gotoPage(steps, PAGE_URL, { objectID: object.objectID });
    });
  });

  test_(209, 'Show number of items in cart', async (steps, chance) => {
    const object = chance.metObject();
    await startInterceptingRequests(steps, [object])
    const cart = chance.nn(chance.cartItem, 1, 10);
    await expectCartItemCount(steps, cart, async () => {
      await gotoPage(steps, PAGE_URL, { objectID: object.objectID });
    });
  });
});