import { defineStore } from 'pinia'
import * as ArtmartService from "@/services/ArtmartService";

export const useArtmartStore = defineStore('artmart', {
  state: () => ({
    frames: null,       // Map: style -> frame { style, label, slice, cost }
    mats: null,         // Map: color -> mat { color, label, hex }
    destinations: null, // Map: country -> destination { country, displayName, cost }
    cart: []            // Array of cart items
  }),
  getters: {
    sortedFrames: state => {
      return Array.from(state.frames.values())
    },
    sortedMats: state => {
      return Array.from(state.mats.values())
    },
    sortedDestinations: state => {
      return Array.from(state.destinations.values())
    },
    cartIsEmpty: state => {
      return state.cart.length == 0
    },
    cartTotal: state => {
      let total = 0;
      for (const item of state.cart) {
        total += item.price;
      }
      return total;
    }
  },
  actions: {
    async loadFrames() {
      const framesList = await ArtmartService.getFrames();
      const frames = new Map();
      for (const frame of framesList) {
        frames.set(frame.style, frame);
      }
      this.frames = frames;
    },
    async loadMats() {
      const matsList = await ArtmartService.getMats();
      const mats = new Map();
      for (const mat of matsList) {
        mats.set(mat.color, mat);
      }
      this.mats = mats;
    },
    async loadDestinations() {
      const shipping = await ArtmartService.getShipping();
      const destinationsList = shipping.countries ?? [];
      const destinations = new Map();
      for (const destination of destinationsList) {
        destinations.set(destination.isoCode, destination);
      }
      this.destinations = destinations;
    },
    async loadCart() {
      const cart = await ArtmartService.getCart();
      this.cart = cart.reverse();
    },
    async addToCart(product) {
      const ok = await ArtmartService.addToCart(product);
      await this.loadCart();
      return ok
    },
    async removeFromCart(cartItemId) {
      const ok = await ArtmartService.deleteCartItem(cartItemId);
      await this.loadCart();
      return ok
    }
  }
})
