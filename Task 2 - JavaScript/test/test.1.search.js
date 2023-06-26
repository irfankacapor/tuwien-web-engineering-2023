import { test_, gotoPage, clickElement, fillElement, expectText } from './jest-tuwien';
import { testValidHtml } from './jest-tuwien/validate';
import { cardinal, xrand } from './jest-tuwien/pretty';
import { startInterceptingRequests, onMetSearchRequest, expectMetObjectsOnPage, expectMetObjectCache, expectCartItemCount } from './util';

const PAGE_URL = 'http://localhost:4444/search.html';
const MET_HIGHLIGHTS = [39799, 459055, 437853, 435809, 436535, 360018, 634108, 459080, 435882, 271890, 459054];

describe('Search', () => {
  testValidHtml(101, '../www/search.html');
});

describe('Search', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    await page.setViewport({ width: 1024, height: 768 });
  });

  test_(102, 'Show highlights', async (steps, chance) => {
    const objects = chance.unique(chance.metObject, MET_HIGHLIGHTS.length);
    for (let i = 0; i < MET_HIGHLIGHTS.length; i++) {
      objects[i].objectID = MET_HIGHLIGHTS[i];
    }
    await startInterceptingRequests(steps, objects);
    await gotoPage(steps, PAGE_URL);
    await expectMetObjectsOnPage(steps, objects);
  });

  test_(103, 'Search via query parameter', async (steps, chance) => {
    const query = chance.searchQuery();
    const results = chance.nn(chance.metObject, 1, 3);
    await startInterceptingRequests(steps, results, { [query]: results.map(obj => obj.objectID) });
    await gotoPage(steps, PAGE_URL, { q: query });
    await expectMetObjectsOnPage(steps, results);
  });

  test_(104, 'Search via search field', async (steps, chance) => {
    const query = chance.searchQuery();
    const results = chance.nn(chance.metObject, 1, 3);
    await startInterceptingRequests(steps, results, { [query]: results.map(obj => obj.objectID) });
    await gotoPage(steps, PAGE_URL);
    await fillElement(steps, 'input[type="search"]', query, { valueStr: xrand });
    await clickElement(steps, 'button', { withText: 'Search', waitForNavigation: true })
    await expectMetObjectsOnPage(steps, results);
  });

  test_(105, 'Show correct text when not searching', async (steps) => {
    await startInterceptingRequests(steps);
    await gotoPage(steps, PAGE_URL);
    steps.push(`expect page to contain the correct text if no search term was given`);
    await expectText('Search our collection of more than 400,000 artworks.');
  });

  test_(106, 'Show correct text when search done', async (steps, chance) => {
    const query1 = chance.searchQuery();
    const query2 = chance.searchQuery();
    const query3 = chance.searchQuery();
    const results1 = chance.nn(chance.metObject, 3, 6);
    const results2 = [chance.metObject()];

    const metObjects = results1.concat(results2);
    let metSearchResultsByQuery = {
      [query1]: results1.map(obj => obj.objectID),
      [query2]: results2.map(obj => obj.objectID)
    }
    await startInterceptingRequests(steps, metObjects, metSearchResultsByQuery);

    await gotoPage(steps, PAGE_URL, { q: query1 });
    steps.push(`expect page to contain the correct text for ${xrand(cardinal(results1.length))} results`)
    await expectText(`Found ${results1.length} artworks for “${query1}”`);

    await gotoPage(steps, PAGE_URL, { q: query2 });
    steps.push(`expect page to contain the correct text for one result`)
    await expectText(`Found 1 artwork for “${query2}”`);

    await gotoPage(steps, PAGE_URL, { q: query3 });
    steps.push(`expect page to contain the correct text for zero results`)
    await expectText(`Found 0 artworks for “${query3}”`);
  });

  test_(107, 'Consider only artworks with images', async (steps, chance) => {
    const query = chance.searchQuery();
    await startInterceptingRequests(steps, [], { [query]: [] });

    let actualRequest = null;
    onMetSearchRequest(url => actualRequest = url);

    await gotoPage(steps, PAGE_URL, { q: query });
    steps.push('expect Met API search request to be restricted to objects that have images');
    try {
      expect(actualRequest).toMatch(/hasImages=true/);
    } catch (e) {
      if (actualRequest) {
        throw Error(`Intercepted the following incorrect request:\n  ${actualRequest}`)
      } else {
        throw Error(`No requests detected.`)
      }
    }
  });

  test_(108, 'Show at most 100 results', async (steps, chance) => {
    const query = chance.searchQuery();
    const results = chance.nn(chance.metObject, 200, 400);
    await startInterceptingRequests(steps, results, { [query]: results.map(obj => obj.objectID) });

    await gotoPage(steps, PAGE_URL, { q: query });

    const museumLabels = await page.evaluate(() => {
      return Array.from(document.getElementsByClassName('museum-label'));
    });

    steps.push(`expect no more than 100 results to be shown`);
    try {
      expect(museumLabels.length).toBe(100);
    } catch (e) {
      throw Error(`Expected number of results: ${100}\n\nActual number of results: ${museumLabels.length}`);
    }
  });

  test_(109, 'Cache Met objects', async (steps, chance) => {
    const query = chance.searchQuery();
    const results = chance.nn(chance.metObject, 1, 3);
    const objectIDs = results.map(obj => obj.objectID);
    await startInterceptingRequests(steps, results, { [query]: objectIDs });
    await expectMetObjectCache(steps, objectIDs, async () => {
      await gotoPage(steps, PAGE_URL, { q: query });
    })
  });

  test_(110, 'Show number of items in cart', async (steps, chance) => {
    await startInterceptingRequests(steps);
    const cart = chance.nn(chance.cartItem, 1, 10);
    await expectCartItemCount(steps, cart, async () => {
      await gotoPage(steps, PAGE_URL);
    })
  });

});
