import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest, createNewCart, getCart, addCartItem, addRandomCartItem } from './util';
import { calculatePrice } from '../server/utils/price.js';
import { xrand, xuser, stringify } from './jest-tuwien/pretty';

function mkExpectedCartItem(item, cartItemId = null) {
  return {
    cartItemId: cartItemId ?? expect.any(Number),
    price: calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth),
    ...item
  };
}

describe('/cart', () => {

  testApp(201, 'Create cart', async (steps) => {
    const sid = await createNewCart(steps);
    const cart = await getCart(steps, sid);
    steps.push('expect cart to be empty');
    expectEquality(cart, []);
  });

  testApp(202, 'Add one item', async (steps, chance) => {
    const sid = await createNewCart(steps);
    const item = await addRandomCartItem(steps, chance, sid);
    const cart = await getCart(steps, sid);
    steps.push('expect cart to contain exactly the item previously added');
    expectEquality(cart, [mkExpectedCartItem(item)]);
  });

  testApp(203, 'Add two items', async (steps, chance) => {
    const sid = await createNewCart(steps);
    const item1 = await addRandomCartItem(steps, chance, sid);
    const item2 = await addRandomCartItem(steps, chance, sid);
    let cart = await getCart(steps, sid);
    steps.push('expect cart to contain exactly the items previously added');
    expectEquality(new Set(cart), new Set([mkExpectedCartItem(item1), mkExpectedCartItem(item2)]))
  });

  testApp(204, 'Unnecessary fields', async (steps, chance) => {
    const sid = await createNewCart(steps);
    const item0 = chance.cartItemWithoutId();
    const item = { price: chance.natural(), hairColor: chance.color(), ...item0 };
    await addCartItem(steps, sid, item, { rand: true });
    const cart = await getCart(steps, sid);
    steps.push('expect cart to contain exactly the item previously added, without unnecessary fields')
    expectEquality(cart, [mkExpectedCartItem(item0)]);
  });

  testApp(205, 'Validation', async (steps, chance) => {
    const item = chance.cartItemWithoutId();
    const field1 = chance.pickone(['artworkId', 'printSize', 'frameStyle', 'frameWidth', 'matWidth']);
    delete item[field1];
    const field2 = chance.pickone(['frameWidth', 'matWidth'].filter(x => x != field1));
    item[field2] = chance.natural({ minimum: 101 });
    const field3 = chance.pickone(['printSize', 'frameStyle', 'matColor'].filter(x => x != field1));
    item[field3] = chance.word();

    const expectedResponse = {
      message: 'Validation failed',
      errors: {}
    };
    expectedResponse.errors[field1] = 'missing'
    expectedResponse.errors[field2] = 'invalid'
    expectedResponse.errors[field3] = 'invalid'

    const sid = await createNewCart(steps);
    const res = await sendRequest(steps, {
      method: 'POST',
      path: '/cart',
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid),
      jsonBody: item,
      jsonBodyStr: stringify(item, { mark: xrand })
    });
    expectStatus(steps, res, 400);
    const message = expectBodyJSON(steps, res);
    steps.push('expect JSON payload to contain the correct validation errors')
    expectEquality(message, expectedResponse);
  });

  testApp(206, 'Multiple carts', async (steps, chance) => {
    const sid1 = await createNewCart(steps);
    const item1 = await addRandomCartItem(steps, chance, sid1);

    const sid2 = await createNewCart(steps);
    const item2 = await addRandomCartItem(steps, chance, sid2);

    const cart1 = await getCart(steps, sid1);
    steps.push('expect cart to contain exactly the item previously added')
    expectEquality(cart1, [mkExpectedCartItem(item1)])

    let cart2 = await getCart(steps, sid2);
    steps.push('expect cart to contain exactly the item previously added')
    expectEquality(cart2, [mkExpectedCartItem(item2)])
  });

  testApp(207, 'Clear cart', async (steps, chance) => {
    const sid = await createNewCart(steps);
    await addRandomCartItem(steps, chance, sid);
    await addRandomCartItem(steps, chance, sid);
    await addRandomCartItem(steps, chance, sid);
    const res = await sendRequest(steps, {
      method: 'DELETE',
      path: '/cart',
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid)
    });
    expectStatus(steps, res, 204);
    const cart = await getCart(steps, sid);
    steps.push('expect cart to be empty')
    expectEquality(cart, []);
  });

  testApp(208, 'Get item', async (steps, chance) => {
    const sid = await createNewCart(steps);
    const item = await addRandomCartItem(steps, chance, sid);

    const cart = await getCart(steps, sid);
    steps.push('expect cart to contain exactly the item previously added')
    expectEquality(cart, [mkExpectedCartItem(item)])
    const cartItemId = cart[0].cartItemId;

    await addRandomCartItem(steps, chance, sid);
    await addRandomCartItem(steps, chance, sid);

    const res = await sendRequest(steps, {
      path: '/cart/' + cartItemId,
      pathStr: '/cart/' + xuser(cartItemId),
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid)
    });
    expectStatus(steps, res, 200);
    const receivedItem = expectBodyJSON(steps, res);
    steps.push('expect JSON payload to be the correct cart item')
    const expectedItem = mkExpectedCartItem(item, cartItemId);
    expectEquality(receivedItem, expectedItem)
  });

  testApp(209, 'Get unknown item', async (steps, chance) => {
    const sid = await createNewCart(steps);
    const cartItemId = chance.natural();
    const res = await sendRequest(steps, {
      path: '/cart/' + cartItemId,
      pathStr: '/cart/' + xrand(cartItemId),
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid)
    });
    expectStatus(steps, res, 404);
  });

  testApp(210, 'Remove item', async (steps, chance) => {
    const sid = await createNewCart(steps);
    const item1 = await addRandomCartItem(steps, chance, sid);
    const item2 = await addRandomCartItem(steps, chance, sid);

    const cart1 = await getCart(steps, sid);
    steps.push('expect cart to contain exactly the items previously added')
    let expectedCart1 = [mkExpectedCartItem(item1), mkExpectedCartItem(item2)]
    expectEquality(new Set(cart1), new Set(expectedCart1))

    const n = chance.natural({ max: cart1.length - 1 })
    const cartItemId = cart1[n].cartItemId;
    const res = await sendRequest(steps, {
      method: 'DELETE',
      path: '/cart/' + cartItemId,
      pathStr: '/cart/' + xuser(cartItemId),
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid)
    })
    expectStatus(steps, res, 204)

    const cart2 = await getCart(steps, sid);
    steps.push('expect cart to not contain the deleted item')
    const expectedCart2 = cart1.filter(x => x.cartItemId != cartItemId);
    expectEquality(new Set(cart2), new Set(expectedCart2));
  });

  testApp(211, 'Remove unknown item', async (steps, chance) => {
    const sid = await createNewCart(steps);
    const item1 = await addRandomCartItem(steps, chance, sid);
    const item2 = await addRandomCartItem(steps, chance, sid);

    const cart = await getCart(steps, sid);
    steps.push('expect cart to contain exactly the items previously added')
    let expectedCart = [mkExpectedCartItem(item1), mkExpectedCartItem(item2)]
    expectEquality(new Set(cart), new Set(expectedCart))

    const cartItemId = chance.natural({ exclude: cart.map(x => x.cartItemId) });
    const res = await sendRequest(steps, {
      method: 'DELETE',
      path: '/cart/' + cartItemId,
      pathStr: '/cart/' + xrand(cartItemId),
      cookie: 'sessionId=' + sid,
      cookieStr: 'sessionId=' + xuser(sid)
    })
    expectStatus(steps, res, 404);
  });

  testApp(212, 'Missing session', async (steps, chance) => {
    for (let method of ['POST', 'DELETE']) {
      const res = await sendRequest(steps, { method, path: '/cart' })
      expectStatus(steps, res, 403);
    }
    for (let method of ['GET', 'DELETE']) {
      const cartItemId = chance.natural();
      const res = await sendRequest(steps, {
        method,
        path: '/cart/' + cartItemId,
        pathStr: '/cart/' + xrand(cartItemId)
      });
      expectStatus(steps, res, 403);
    }
  });

  testApp(213, 'Invalid session', async (steps, chance) => {
    for (let method of ['GET', 'POST', 'DELETE']) {
      const sid = chance.string();
      const res = await sendRequest(steps, {
        method,
        path: '/cart',
        cookie: 'sessionId=' + sid,
        cookieStr: 'sessionId=' + xrand(sid)
      })
      expectStatus(steps, res, 403);
    }
    for (let method of ['GET', 'DELETE']) {
      const cartItemId = chance.natural();
      const sid = chance.string();
      const res = await sendRequest(steps, {
        method,
        path: '/cart/' + cartItemId,
        pathStr: '/cart/' + xrand(cartItemId),
        cookie: 'sessionId=' + sid,
        cookieStr: 'sessionId=' + xrand(sid)
      });
      expectStatus(steps, res, 403);
    }
  });

})
