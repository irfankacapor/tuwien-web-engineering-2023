import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest } from './util';

describe('/mats', () => {

  testApp(501, 'Mat colors', async (steps) => {
    const res = await sendRequest(steps, { path: '/mats' } );
    expectStatus(steps, res, 200);
    const body = expectBodyJSON(steps, res);
    steps.push('expect response to contain the correct mat colors');
    expectEquality(body, [
        { color: "tea", label: "Tea", hex: "#D4E4BC" },
        { color: "cerise", label: "Cerise", hex: "#E34A6F" },
        { color: "cerulean", label: "Cerulean", hex: "#407899" },
        { color: "oxford", label: "Oxford", hex: "#0B132B" },
        { color: "raisin", label: "Raisin", hex: "#221D23" }
    ]);
  });

});
