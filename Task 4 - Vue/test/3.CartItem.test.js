import { test_, expectText, getComponent, getElement, expectPropValue } from './jest-tuwien';
import { describe, expect, afterEach, vi } from "vitest"
import { stringify, xrand } from "./jest-tuwien/pretty";
import { mount, flushPromises } from "@vue/test-utils";
import { createTestingPinia } from '@pinia/testing';
import { useArtmartStore } from "../src/store";
import { fm, fetchMock } from './jest-tuwien/fetch';
import { cartDescription } from './obf';

import router from '../src/router';
import CartItem from "../src/components/CartItem.vue";
import FramedArtwork from "../src/components/FramedArtwork.vue";
import MuseumLabel from "../src/components/MuseumLabel.vue";

function mockArtmart(steps, chance) {
  const cartItem = chance.cartItem();
  const artwork = chance.artwork({ artworkId: cartItem.artworkId });
  const artworkStr = stringify(artwork, { mark: xrand });

  steps.push(
    'start intercepting requests to the Artmart API',
    `The first <code>GET</code> request to <code>/artworks/${xrand(artwork.artworkId)}</code> ` +
    `will return <code>200 OK</code> with the following JSON payload:\n<pre>${artworkStr}</pre>`
  )
  fetchMock.mockOnceIf(fm.and(fm.isHttpGet, fm.urlIncludes(`/artworks/${artwork.artworkId}`)), fm.respondJson(artwork));
  fetchMock.mockResponse(() => ({ status: 501 }));

  return { cartItem, artwork };
}

function mountCartItem(steps, cartItem, store = null) {
  const cartItemStr = stringify(cartItem, { mark: xrand, inspect: true })
  steps.push(
    `mount the <code>CartItem</code> component with stubbed child components`,
    `The <code>cartItem</code> prop is set to the following value: <pre>${cartItemStr}</pre>`
  )
  const plugins = [router];
  if (store) plugins.push(store);
  return mount(CartItem, {
    stubs: {
      FramedArtwork: true,
    },
    props: { cartItem }, global: {
      plugins,
    }
  });
}


describe('CartItem', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  test_(301, 'FramedArtwork subcomponent', async (steps, chance) => {
    const { cartItem, artwork } = mockArtmart(steps, chance);
    const wrapper = mountCartItem(steps, cartItem);
    await flushPromises();

    steps.push('expect to find a <code>FramedArtwork</code> subcomponent')
    const framedArtwork = getComponent(wrapper, FramedArtwork);

    steps.push('expect <code>FramedArtwork</code> props to be bound correctly')
    expectPropValue(framedArtwork, 'artwork.image', artwork.image);
    expectPropValue(framedArtwork, 'artwork.title', artwork.title);
    expectPropValue(framedArtwork, 'config.printSize', cartItem.printSize);
    expectPropValue(framedArtwork, 'config.frameStyle', cartItem.frameStyle);
    expectPropValue(framedArtwork, 'config.matColor', cartItem.matColor);
  });

  test_(302, 'MuseumLabel subcomponent', async (steps, chance) => {
    const { cartItem, artwork } = mockArtmart(steps, chance);
    const wrapper = mountCartItem(steps, cartItem);
    await flushPromises();
    steps.push('expect to find a <code>MuseumLabel</code> subcomponent')
    const museumLabel = getComponent(wrapper, MuseumLabel);
    steps.push('expect <code>MuseumLabel</code> props to be bound correctly')
    expectPropValue(museumLabel, 'artwork.title', artwork.title);
    expectPropValue(museumLabel, 'artwork.artist', artwork.artist);
    expectPropValue(museumLabel, 'artwork.date', artwork.date);
  });

  test_(303, 'Frame description', async (steps, chance) => {
    const { cartItem } = mockArtmart(steps, chance);
    const wrapper = mountCartItem(steps, cartItem);
    await flushPromises();
    steps.push('expect frame description to match cart item')
    expectText(wrapper, cartDescription(cartItem), false);
  });

  test_(304, 'Price', async (steps, chance) => {
    const { cartItem } = mockArtmart(steps, chance);
    const wrapper = mountCartItem(steps, cartItem);
    await flushPromises();
    steps.push('expect price to match cart item')
    expectText(wrapper, '€ ' + (cartItem.price / 100).toFixed(2), false);
  });

  test_(305, 'Remove', async (steps, chance) => {
    const { cartItem } = mockArtmart(steps, chance);
    const pinia = createTestingPinia({
      // Replace every action with a spy that always returns true
      createSpy: () => vi.fn(() => Promise.resolve(true))
    });
    const store = useArtmartStore();

    const wrapper = mountCartItem(steps, cartItem, pinia);
    await flushPromises();

    steps.push('click remove button')
    const removeButton = getElement(wrapper, 'button.cart-remove');
    await removeButton.trigger('click');

    steps.push('expect the appropiate store action to be dispatched');
    expect(store.removeFromCart).toHaveBeenCalledWith(cartItem.cartItemId);

  });

});
