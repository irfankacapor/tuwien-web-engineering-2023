import { test_, expectText, getElement, getComponent, getAllComponents, expectPropValue, emitEvent, expectLocalData } from './jest-tuwien';
import { describe, expect, afterEach, vi } from "vitest"
import { stringify, xrand } from "./jest-tuwien/pretty";
import { shallowMount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { useArtmartStore } from "../src/store";
import { fm, fetchMock } from './jest-tuwien/fetch';
import { calculatePrice } from './obf';

import router from '../src/router';
import Framing from '../src/pages/FramingPage.vue';
import WidthSlider from "../src/components/framing/WidthSlider.vue";
import FrameStylePicker from "../src/components/framing/FrameStylePicker.vue";
import MatColorPicker from "../src/components/framing/MatColorPicker.vue";


function mockArtmart(steps, chance) {
  const artwork = chance.artwork();
  const artworkStr = stringify(artwork, { mark: xrand });

  steps.push(
    'start intercepting requests to the Artmart API',
    `The first <code>GET</code> request to <code>/artworks/${xrand(artwork.artworkId)}</code> ` +
    `will return <code>200 OK</code> with the following JSON payload:\n<pre>${artworkStr}</pre>`
  )
  fetchMock.mockOnceIf(fm.and(fm.isHttpGet, fm.urlIncludes(`/artworks/${artwork.artworkId}`)), fm.respondJson(artwork));
  fetchMock.mockResponse(() => ({ status: 501 }));

  return artwork;
}

async function mountFramingPage(steps, chance, artwork) {
  const frames = new Map();
  for (const frame of chance.nn(chance.frame, 3, 5)) {
    frames.set(frame.style, frame);
  }
  const mats = new Map();
  for (const mat of chance.nn(chance.mat, 3, 5)) {
    mats.set(mat.color, mat);
  }
  const pinia = createTestingPinia({
    // Replace every action with a spy that always returns true
    createSpy: () => vi.fn(() => Promise.resolve(true))
  });
  const store = useArtmartStore();
  store.frames = frames;
  store.mats = mats;

  const stateStr = stringify(store.$state, { mark: xrand, inspect: true })
  steps.push(
    'mount the <code>Framing</code> page with stubbed child components and a mock store',
    `The <code>artworkId</code> prop is set to the value <code>${xrand(artwork.artworkId)}</code> ` +
    `and the mocked store contains the following initial state: <pre>${stateStr}</pre>`
  );
  const wrapper = shallowMount(Framing, {
    props: {
      artworkId: artwork.artworkId
    },
    global: {
      plugins: [
        pinia,
        router
      ],
    }
  });


  await flushPromises();
  return { wrapper, store };
}

async function setRandomFraming(steps, chance, wrapper, store) {
  const frameStyles = store.sortedFrames.map(x => x.style);
  const matColors = store.sortedMats.map(x => x.color);

  const config = {
    printSize: chance.printSize(),
    frameWidth: chance.frameWidth(),
    frameStyle: chance.pickone(frameStyles),
    matWidth: chance.matWidth(),
    matColor: chance.pickone(matColors)
  }

  steps.push(
    `set local data <code>config</code> of <code>Framing</code> to a random value`,
    `<pre>${stringify(config, { mark: xrand, inspect: true })}`
  )
  wrapper.vm.$data.config = config;
  await wrapper.vm.$nextTick();

  const frameCost = store.frames.get(config.frameStyle).cost;
  const price = calculatePrice(config.printSize, frameCost, config.frameWidth, config.matWidth);
  return { config, price }
}

describe('Framing', () => {

  afterEach(() => {
    fetchMock.mockReset();
  });

  test_(201, 'Frame width slider', async (steps, chance) => {
    const artwork = mockArtmart(steps, chance);
    const { wrapper } = await mountFramingPage(steps, chance, artwork);

    steps.push('expect to find a <code>WidthSlider</code> component for the frame width')
    const widthSliders = getAllComponents(wrapper, WidthSlider, 2);
    const frameWidthSlider = widthSliders.at(0);

    steps.push('expect <code>WidthSlider</coder> props to be bound correctly')
    expectPropValue(frameWidthSlider, 'min', 20);
    expectPropValue(frameWidthSlider, 'max', 50);
    expectPropValue(frameWidthSlider, 'label', 'Frame');

    const xs = chance.unique(chance.integer, 5, { min: 20, max: 50 });
    for (const x of xs) {
      await emitEvent(steps, wrapper, frameWidthSlider, 'update:modelValue', x);
      expectLocalData(steps, wrapper, 'config.frameWidth', x);
    }
  });

  test_(202, 'Frame style picker', async (steps, chance) => {
    const artwork = mockArtmart(steps, chance);
    const { wrapper, store } = await mountFramingPage(steps, chance, artwork);
    steps.push('expect to find a <code>FrameStylePicker</code> component')
    const frameStylePicker = getComponent(wrapper, FrameStylePicker);

    const frameStyles = chance.shuffle(store.sortedFrames.map(x => x.style))
    for (const frameStyle of frameStyles) {
      await emitEvent(steps, wrapper, frameStylePicker, 'update:modelValue', frameStyle);
      expectLocalData(steps, wrapper, 'config.frameStyle', frameStyle);
    }
  });

  test_(203, 'Mat width slider', async (steps, chance) => {
    const artwork = mockArtmart(steps, chance);
    const { wrapper } = await mountFramingPage(steps, chance, artwork);

    steps.push('expect to find a <code>WidthSlider</code> component for the mat width')
    const widthSliders = getAllComponents(wrapper, WidthSlider, 2);
    const matWidthSlider = widthSliders.at(1);

    steps.push('expect <code>WidthSlider</coder> props to be bound correctly')
    expectPropValue(matWidthSlider, 'min', 0);
    expectPropValue(matWidthSlider, 'max', 100);
    expectPropValue(matWidthSlider, 'label', 'Mat');

    const xs = chance.unique(chance.integer, 5, { min: 20, max: 50 });
    for (const x of xs) {
      await emitEvent(steps, wrapper, matWidthSlider, 'update:modelValue', x);
      expectLocalData(steps, wrapper, 'config.matWidth', x);
    }
  });

  test_(204, 'Mat color picker', async (steps, chance) => {
    const artwork = mockArtmart(steps, chance);
    const { wrapper, store } = await mountFramingPage(steps, chance, artwork);
    steps.push('expect to find a <code>MatColorPicker</code> component')
    const matColorPicker = getComponent(wrapper, MatColorPicker);

    const matColors = chance.shuffle(store.sortedMats.map(x => x.color))
    for (const matColor of matColors) {
      await emitEvent(steps, wrapper, matColorPicker, 'update:modelValue', matColor);
      expectLocalData(steps, wrapper, 'config.matColor', matColor);
    }
  });

  test_(205, 'Price', async (steps, chance) => {
    const artwork = mockArtmart(steps, chance);
    const { wrapper, store } = await mountFramingPage(steps, chance, artwork);

    for (let i = 0; i < chance.integer({ min: 3, max: 5 }); i++) {
      const { price } = await setRandomFraming(steps, chance, wrapper, store);
      steps.push('expect price on page to match framing');
      const priceSpan = getElement(wrapper, '#price');
      expectText(priceSpan, '€ ' + (price / 100).toFixed(2));
    }
  });

  test_(206, 'Add to Cart', async (steps, chance) => {
    const artwork = mockArtmart(steps, chance);
    const { wrapper, store } = await mountFramingPage(steps, chance, artwork);
    const { config } = await setRandomFraming(steps, chance, wrapper, store);

    steps.push('click "Add to Cart" button');
    const addToCartButton = getElement(wrapper, 'button.buy');
    await addToCartButton.trigger('click');

    steps.push('expect the appropiate store action to be dispatched');
    const product = { artworkId: artwork.artworkId, ...config };
    expect(store.addToCart).toHaveBeenCalledWith(product);

    steps.push('wait for redirect to <code>/cart</code>');
    await flushPromises();
    try {
      expect(wrapper.vm.$route.path).toBe('/cart');
    } catch (e) {
      throw Error(
        'Expected path of current route: /cart\n' +
        'Actual path of current route: ' + wrapper.vm.$route.path
      );
    }
  });
});