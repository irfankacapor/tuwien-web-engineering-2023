import { reloadPage, expectElementProperty, expectText } from './jest-tuwien';
import { cardinal, pluralise, rows, xrand, stringifyRand } from './jest-tuwien/pretty';
import fs from 'fs';
import path from 'path';

const MET_API_HOST = 'collectionapi.metmuseum.org';
const MET_API_PATH = '/public/collection/v1/';
const MET_BASE_URL = 'https://' + MET_API_HOST + MET_API_PATH;
const IMAGE_HOST = 'images.example.com';

const testImageBuffer = fs.readFileSync(path.join(__dirname, 'test.jpg'));

async function startInterceptingRequests(steps, metObjects = [], metSearchResultsByQuery = {}) {
  let metObjectsByID = {}
  metObjects.forEach(obj => metObjectsByID[obj.objectID] = obj);

  steps.push(
    'start intercepting HTTP requests',
    '<ul>' +
    '<li><code>GET</code> requests to relevant parts of the Met API will return <x-rand>random</x-rand> responses.</li>' +
    '<li><code>GET</code> requests to <code>images.example.com</code> will return a test image.</li>' +
    '<li><code>GET</code> requests to <code>localhost</code> will continue unaltered.</li>' +
    '<li>All other requests will be aborted.</li>' +
    '</ul>'
  );
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = new URL(req.url());
    if (req.method() == 'GET' && url.hostname == MET_API_HOST) {
      if (url.pathname.startsWith(MET_API_PATH + 'objects/')) {
        const objectID = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        const object = metObjectsByID[objectID];
        if (object) {
          req.respond({
            contentType: 'application/json',
            body: JSON.stringify(object)
          });
        } else {
          req.respond({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'ObjectID not found' })
          });
        }
      } else if (url.pathname == MET_API_PATH + 'search') {
        const query = url.searchParams.get('q');
        const results = metSearchResultsByQuery[query] ?? null;
        req.respond({
          contentType: 'application/json',
          body: JSON.stringify({
            total: results != null ? results.length : 0,
            objectIDs: results
          })
        });
      } else {
        req.abort();
      }
    } else if (req.method() == 'GET' && url.hostname == IMAGE_HOST) {
      req.respond({
        contentType: 'image/jpeg',
        body: testImageBuffer
      });
    } else if (req.method() == 'GET' && url.hostname == 'localhost') {
      req.continue();
    } else {
      req.abort();
    }
  });
}

function onMetSearchRequest(fn) {
  page.on('request', req => {
    if (req.url().startsWith(MET_BASE_URL + 'search')) {
      fn(req.url());
    }
  });
}

function onMetObjectRequest(fn) {
  page.on('request', req => {
    if (req.url().startsWith(MET_BASE_URL + 'objects/')) {
      fn(req.url());
    }
  });
}

async function expectMetObjectsOnPage(steps, expectedObjects) {
  const imgs = await page.evaluate(() => {
    return Array.from(document.getElementsByTagName('img')).map(e => e.src);
  });
  for (const obj of expectedObjects) {
    steps.push(
      `expect page to contain artwork and description for object <code>${xrand(obj.objectID)}</code>`,
      `<pre>${stringifyRand(obj)}</pre>`
    );
    await expectText(obj.artistDisplayName);
    await expectText(`${obj.title}, ${obj.objectDate}`);
    try {
      expect(imgs).toContainEqual(obj.primaryImageSmall);
    } catch (e) {
      throw Error(
        'Expected to find the image:\n  ' + obj.primaryImageSmall + '\n\n' +
        'Actual images found on page:\n' + rows(imgs)
      );
    }
  }
}

async function expectMetObjectCache(steps, objectIDs, gotoFn) {
  const expectedRequests = new Set(objectIDs.map(x => MET_BASE_URL + 'objects/' + x));
  const actualRequests = new Set();
  onMetObjectRequest(url => actualRequests.add(url));
  await gotoFn();

  const n = objectIDs.length;
  const objString = objectIDs.map(x => `<code>${xrand(x)}</code>`).join(', ');
  steps.push(`expect Met API ${pluralise('request', n)} for ${pluralise('object', n)} ${objString}`);
  try {
    expect(actualRequests).toEqual(expectedRequests);
  } catch (e) {
    throw Error(
      'Expected requests:\n' + rows(expectedRequests) + '\n\n' +
      'Actual requests:\n' + rows(actualRequests) + '\n\n' +
      '(The order of requests does not matter.)'
    );
  }

  actualRequests.clear();
  await reloadPage(steps);

  steps.push('expect no more Met API requests (due to caching)');
  try {
    expect(actualRequests).toEqual(new Set());
  } catch (e) {
    throw Error(
      'Expected requests:\n  (none)\n\n' +
      'Actual requests:\n' + rows(actualRequests) + '\n\n' +
      '(The order of requests does not matter.)'
    );
  }
}

async function expectCartItemCount(steps, cart, gotoFn) {
  await setCart(steps, cart);
  await gotoFn();
  await expectElementProperty(steps, 'nav > a[href="cart.html"]', 'innerText',
    `Cart (${cart.length})`, { valueStr: `Cart (${xrand(cart.length)})` }
  );
  await setCart(steps, []);
  await reloadPage(steps);
  await expectElementProperty(steps, 'nav > a[href="cart.html"]', 'innerText', 'Cart');
}

async function setCart(steps, cart) {
  steps.push(
    `put ${xrand(cardinal(cart.length))} ${pluralise('item', cart.length)} in the cart`,
    `<pre>localStorage.setItem('cart', JSON.stringify(${stringifyRand(cart)}))</pre>`
  );
  await page.evaluateOnNewDocument(cart => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, cart);
}

module.exports = {
  startInterceptingRequests,
  onMetSearchRequest,
  onMetObjectRequest,
  expectMetObjectsOnPage,
  expectMetObjectCache,
  expectCartItemCount,
  setCart
}
