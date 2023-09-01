import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest } from './util';
import { rows, xrand, stringify } from './jest-tuwien/pretty';

const MET_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1'

//----------------------------------------------------------------------------

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox())
const fetchMock = require('node-fetch')

function startFetchMock(steps, metObjects = [], metSearchResultsByQuery = {}) {
  steps.push(
    'start intercepting requests to the Met API',
    '<ul>' +
    '<li>All <code>GET</code> requests to relevant parts of the Met API will return <x-rand>random</x-rand> responses.</li>\n' +
    '<li>All other requests will result in a response of <code>501 Not Implemented</code>.</li>' +
    '</ul>'
  );

  let metObjectsByID = {}
  metObjects.forEach(obj => metObjectsByID[obj.objectID] = obj);

  fetchMock.get(`begin:${MET_BASE_URL}/search`, url => {
    const query = new URL(url).searchParams;
    if (query.get('hasImages') != 'true') {
      return { total: 0, objectIDs: null };
    } else {
      const q = query.get('q');
      const results = metSearchResultsByQuery[q] ?? null;
      return { total: (results ?? []).length, objectIDs: results }
    }
  });

  fetchMock.get(`glob:${MET_BASE_URL}/objects/*`, url => {
    const oid = url.substring(url.lastIndexOf('/') + 1);
    return metObjectsByID[oid] ?? { status: 404, body: { message: 'ObjectID not found' } };
  });

  fetchMock.any(() => {
    return 501;
  })
};

function resetFetchMock() {
  fetchMock.reset();
}

function expectFetchRequests(expectedUrls) {
  const actualUrls = fetchMock.calls().map(x => x[0]);
  try {
    expect(actualUrls).toEqual(expectedUrls);
  } catch (e) {
    throw Error(
      'Expected requests:\n' + rows(expectedUrls, 2) +
      '\n\nActual requests:\n' + rows(actualUrls, 2)
    )
  }
}

//----------------------------------------------------------------------------

const highlights = [39799, 459055, 437853, 435809, 436535, 360018, 634108, 459080, 435882, 271890, 459054];

function mkArtwork(obj) {
  return {
    artworkId: obj.objectID,
    title: obj.title,
    artist: obj.artistDisplayName,
    date: obj.objectDate,
    image: obj.primaryImageSmall
  };
}

async function getArtwork(steps, objectID, { rand = true } = {}) {
  steps.beginGroup(`get artwork with ID <code>${rand ? xrand(objectID) : objectID}</code>`)
  const res = await sendRequest(steps, {
    path: '/artworks/' + objectID,
    pathStr: '/artworks/' + (rand ? xrand(objectID) : objectID)
  });
  expectStatus(steps, res, 200);
  const artwork = expectBodyJSON(steps, res);
  steps.endGroup();
  return artwork;
}

async function search(steps, query, { rand = true } = {}) {
  steps.beginGroup(`search for <code>${rand ? xrand(query) : query}</code>`)
  query = encodeURIComponent(query);
  const res = await sendRequest(steps, {
    path: '/artworks?q=' + query,
    pathStr: '/artworks?q=' + (rand ? xrand(query) : query)
  });
  expectStatus(steps, res, 200);
  const results = expectBodyJSON(steps, res);
  steps.endGroup();
  return results;
}

function expectMetMatch(steps, artwork, obj) {
  steps.push(
    'expect artwork to match corresponding Met object',
    `The object returned by the (mock) Met API for <code>/objects/${xrand(obj.objectID)}</code> was ` +
    `<pre>${stringify(obj, { mark: xrand })}</pre>`
  );
  expectEquality(artwork, mkArtwork(obj));
}

//----------------------------------------------------------------------------

describe('/artworks', () => {

  afterEach(() => {
    resetFetchMock();
  });

  testApp(101, 'Artwork', async (steps, chance) => {
    const obj = chance.metObject();
    startFetchMock(steps, [obj]);
    const artwork = await getArtwork(steps, obj.objectID);
    expectMetMatch(steps, artwork, obj);
  });

  testApp(102, 'Unknown artwork', async (steps, chance) => {
    startFetchMock(steps);
    const oid = chance.metObjectID();
    const res = await sendRequest(steps, {
      path: '/artworks/' + oid,
      pathStr: '/artworks/' + xrand(oid)
    });
    expectStatus(steps, res, 404)
  });

  testApp(103, 'Artwork cache', async (steps, chance) => {
    const obj = chance.metObject();
    startFetchMock(steps, [obj]);

    const artwork1 = await getArtwork(steps, obj.objectID);
    expectMetMatch(steps, artwork1, obj);
    steps.push('expect one request to the Met API to have been made');
    expectFetchRequests([`${MET_BASE_URL}/objects/${obj.objectID}`])

    fetchMock.resetHistory();

    const artwork2 = await getArtwork(steps, obj.objectID);
    expectMetMatch(steps, artwork2, obj);
    steps.push('expect no further requests to the Met API to have been made')
    expectFetchRequests([])
  });

  testApp(104, 'Highlights', async (steps, chance) => {
    const objects = highlights.map(x => chance.metObject({ objectID: x }));
    startFetchMock(steps, objects);

    const res = await sendRequest(steps, { path: '/artworks' });
    expectStatus(steps, res, 200);
    const artworks = expectBodyJSON(steps, res);
    steps.push('expect response to contain the highlighted artworks')
    expectEquality(artworks, objects.map(x => mkArtwork(x)))
  });

  testApp(105, 'Highlights cache', async (steps, chance) => {
    const objects = highlights.map(x => chance.metObject({ objectID: x }));
    startFetchMock(steps, objects);

    steps.beginGroup('get highlights');
    const res1 = await sendRequest(steps, { path: '/artworks' });
    expectStatus(steps, res1, 200);
    const artworks1 = expectBodyJSON(steps, res1);
    steps.push('expect response to contain the highlighted artworks')
    expectEquality(artworks1, objects.map(x => mkArtwork(x)))
    steps.endGroup();

    steps.push('expect one request to the Met API to have been made per artwork');
    expectFetchRequests(objects.map(x => `${MET_BASE_URL}/objects/${x.objectID}`))

    fetchMock.resetHistory();

    steps.beginGroup('get highlights');
    const res2 = await sendRequest(steps, { path: '/artworks' });
    expectStatus(steps, res2, 200);
    const artworks2 = expectBodyJSON(steps, res2);
    steps.push('expect response to contain the highlighted artworks')
    expectEquality(artworks2, objects.map(x => mkArtwork(x)))
    steps.endGroup();

    steps.push('expect no further requests to the Met API to have been made');
    expectFetchRequests([])
  });

  testApp(106, 'Search', async (steps, chance) => {
    const query = chance.searchQuery();
    const objects = chance.nn(chance.metObject, 3, 5);
    startFetchMock(steps, objects, { [query]: objects.map(x => x.objectID) });
    const results = await search(steps, query);
    steps.push('expect search results to match corresponding Met search results')
    expectEquality(results, objects.map(x => mkArtwork(x)))
  });

  testApp(107, 'Search without results', async (steps, chance) => {
    const query = chance.searchQuery();
    startFetchMock(steps);
    const results = await search(steps, query);
    steps.push('expect empty search results')
    expectEquality(results, [])
  });

  testApp(108, 'Search cache', async (steps, chance) => {
    const query = chance.searchQuery();
    const objects = chance.nn(chance.metObject, 3, 5);
    startFetchMock(steps, objects, { [query]: objects.map(x => x.objectID) });

    const results1 = await search(steps, query);
    steps.push('expect search results to match corresponding Met search results')
    expectEquality(results1, objects.map(x => mkArtwork(x)))

    steps.push('expect the right number of Met API requests to have been made');
    let reqs = [`${MET_BASE_URL}/search?hasImages=true&q=${encodeURIComponent(query)}`]
    reqs = reqs.concat(objects.map(x => `${MET_BASE_URL}/objects/${x.objectID}`))
    try {
      expectFetchRequests(reqs)
    } catch(_) {
      let reqs2 = [`${MET_BASE_URL}/search?q=${encodeURIComponent(query)}&hasImages=true`]
      reqs2 = reqs2.concat(objects.map(x => `${MET_BASE_URL}/objects/${x.objectID}`))
      expectFetchRequests(reqs2)
    }
    

    fetchMock.resetHistory();

    const results2 = await search(steps, query);
    steps.push('expect search results to match corresponding Met search results')
    expectEquality(results2, objects.map(x => mkArtwork(x)))

    steps.push('expect no further requests to the Met API to have been made');
    expectFetchRequests([])
  });
});
