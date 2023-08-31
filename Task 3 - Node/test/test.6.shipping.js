import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest } from './util';

describe('/shipping', () => {

  testApp(601, 'Shipping destinations', async (steps) => {
    const res = await sendRequest(steps, { path: '/shipping' });
    expectStatus(steps, res, 200);
    const body = expectBodyJSON(steps, res);
    steps.push('expect response to contain the correct shipping destinations');
    expectEquality(body, {
      countries: [
          { displayName: "Austria", isoCode: "AT", price: 1500, freeShippingPossible: true, freeShippingThreshold: 10000 },
          { displayName: "Germany", isoCode: "DE", price: 1800, freeShippingPossible: true, freeShippingThreshold: 15000 },
          { displayName: "Switzerland", isoCode: "CH", price: 2500, freeShippingPossible: true, freeShippingThreshold: 30000 },
          { displayName: "United Kingdom", isoCode: "GB", price: 3000, freeShippingPossible: false },
          { displayName: "Netherlands", isoCode: "NL", price: 2000, freeShippingPossible: true, freeShippingThreshold: 15000 }
      ]
    });
  });

});
