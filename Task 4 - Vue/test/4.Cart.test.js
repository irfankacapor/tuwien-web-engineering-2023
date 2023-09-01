import { test_, expectText, getComponent, expectPropValue } from './jest-tuwien';
import { describe, expect, vi } from "vitest"
import { stringify, xrand, cardinal, ordinal } from "./jest-tuwien/pretty";
import { shallowMount } from "@vue/test-utils";
import { createTestingPinia } from '@pinia/testing';
import { useArtmartStore } from "../src/store";
import router from '../src/router';
import { RouterLink } from 'vue-router';
import Cart from "../src/pages/CartPage.vue";
import CartItem from "../src/components/CartItem.vue";

function mountCartPage(steps, cart) {
  const pinia = createTestingPinia({
    // Replace every action with a spy that always returns true
    createSpy: () => vi.fn(() => Promise.resolve(true))
  });
  const store = useArtmartStore();
  store.cart = cart;
  const stateStr = stringify(store.$state, { mark: xrand, inspect: true });
  steps.push(
    `mount the <code>Cart</code> page with stubbed child components and a mock store`,
    `The mocked store contains the following initial state: <pre>${stateStr}</pre>`
  );
  const wrapper = shallowMount(Cart, {
    global: {
      plugins: [
        pinia,
        router
      ],
    }
  });
  return { wrapper, store }
}

describe('Cart', () => {
  test_(401, 'Empty state', (steps) => {
    const { wrapper } = mountCartPage(steps, []);
    steps.push('expect page to show empty cart message');
    expectText(wrapper, 'There are no items in your shopping cart.')
  });

  test_(402, 'CartItem subcomponents', (steps, chance) => {
    const cart = chance.cart();
    const { wrapper } = mountCartPage(steps, cart);
    steps.push(`expect to find ${xrand(cardinal(cart.length))} <code>CartItem</code> components on the page`);
    const cartItemComponents = wrapper.findAllComponents(CartItem);
    try {
      expect(cartItemComponents).toHaveLength(cart.length);
    } catch (e) {
      throw Error(
        'Expected number of CartItem components: ' + cart.length + '\n' +
        'Actual number of CartItem components: ' + cartItemComponents.length
      )
    }
    for (let i = 0; i < cart.length; i++) {
      steps.push(`expect ${ordinal(i + 1)} <code>CartItem</code> component to match ${ordinal(i + 1)} item in the cart`);
      const cartItemComponent = cartItemComponents.at(i);
      expectPropValue(cartItemComponent, 'cartItem', cart[i]);
    }
  });

  test_(403, 'Total price', (steps, chance) => {
    const cart = chance.cart();
    const { wrapper, store } = mountCartPage(steps, cart);
    steps.push('expect total price to be correct');
    const priceDiv = wrapper.get('.cart-total .price');
    const total = (store.cartTotal / 100).toFixed(2);
    expect(priceDiv.element.innerHTML).toBe('Total: € ' + total);
  });

  test_(404, 'Checkout', (steps, chance) => {
    const cart = chance.cart();
    const { wrapper } = mountCartPage(steps, cart);
    steps.push('expect checkout button to link to checkout page')
    const checkoutButton = getComponent(wrapper, RouterLink);
    expectPropValue(checkoutButton, 'to', '/checkout');
  });
});
