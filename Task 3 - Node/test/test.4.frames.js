import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest } from './util';
import { xrand } from './jest-tuwien/pretty';
import fs from 'fs';
import * as pathLib from 'path';

const expectedFrames = [
  { style: 'classic', label: 'Classic', slice: 115, cost: 110 },
  { style: 'natural', label: 'Natural', slice: 75, cost: 85 },
  { style: 'shabby', label: 'Shabby', slice: 120, cost: 100 },
  { style: 'elegant', label: 'Elegant', slice: 107, cost: 90 }
];

describe('/frames', () => {
  testApp(401, 'Frame styles', async (steps) => {
    const res = await sendRequest(steps, { path: '/frames' });
    expectStatus(steps, res, 200);
    const frames = expectBodyJSON(steps, res);
    steps.push('expect response to contain the correct frames');
    expectEquality(frames, expectedFrames);
  });

  testApp(402, 'Frame image', async (steps, chance) => {
    const frameStyle = chance.pickone(expectedFrames.map(x => x.style));
    const image = chance.pickone([
      { imageType: 'thumbImage', contentType: 'image/png', ext: '-thumb.png' },
      { imageType: 'borderImage', contentType: 'image/jpeg', ext: '.jpg' }
    ]);
    const res = await sendRequest(steps, {
      path: '/frames/' + frameStyle + '/' + image.imageType,
      pathStr: '/frames/' + xrand(frameStyle) + '/' + xrand(image.imageType)
    });
    expectStatus(steps, res, 200);

    steps.push('expect response to contain the correct image');
    if (res.headers['content-type'] != image.contentType) {
      throw Error(
        'Expected:\n  Content-Type: ' + image.contentType + '\n\n' +
        'Received:\n  Content-Type: ' + res.headers['content-type']
      );
    }
    const src = pathLib.join(__dirname, `../server/resources/frame-styles/${frameStyle}${image.ext}`);
    const img = fs.readFileSync(src);
    if (img != res.body) {
      throw Error(`Received data (${res.body.length} bytes) does not match expected data (${img.length} bytes)`);
    }
  });

  testApp(403, 'Unknown frame style', async (steps, chance) => {
    const frameStyle = chance.word();
    const imageType = chance.pickone(['thumbImage', 'borderImage']);
    const res = await sendRequest(steps, {
      path: '/frames/' + frameStyle + '/' + imageType,
      pathStr: '/frames/' + xrand(frameStyle) + '/' + xrand(imageType)
    });
    expectStatus(steps, res, 404);
  });

  testApp(404, 'Unknown image type', async (steps, chance) => {
    const frameStyle = chance.pickone(expectedFrames.map(x => x.style));
    const imageType = chance.word();
    const res = await sendRequest(steps, {
      path: '/frames/' + frameStyle + '/' + imageType,
      pathStr: '/frames/' + xrand(frameStyle) + '/' + xrand(imageType)
    });
    expectStatus(steps, res, 404);
  });

});
