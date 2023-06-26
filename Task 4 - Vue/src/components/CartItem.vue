<template>
  <div class="cart-item" v-if="artwork">
    <router-link :to="framingRoute">
      <div class="cart-preview">
        <framed-artwork :artwork="artwork" :config="cartItem" />
      </div>
    </router-link>
    <museum-label :artwork="artwork">
      <div class="cart-frame-description">{{ description }}</div>
      <div class="cart-price">€ {{ priceText }}</div>
      <button class="cart-remove" @click="removeFromCart"></button>
    </museum-label>
  </div>
</template>

<script>
import FramedArtwork from "@/components/FramedArtwork.vue";
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";
// Import the needed components
import MuseumLabel from "@/components/MuseumLabel.vue";
import {getArtwork} from "../services/ArtmartService";

export default {
  name: "CartItem",
  components: {
    FramedArtwork,
    MuseumLabel,
  },
  props: {
    cartItem: {
      artworkId: Number,
      price: Number,
      printSize: String,
      frameWidth: Number,
      frameStyle: String,
      matWidth: Number,
      matColor: String,
    },
  },
  data() {
    return {
      artwork: null,
    };
  },
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    description() {
      let s = { S: "Small", M: "Medium", L: "Large" }[this.cartItem.printSize];
      s += ` print in a ${this.cartItem.frameWidth / 10} cm`;
      s += ` ${this.cartItem.frameStyle} frame`;
      if (this.cartItem.matWidth > 0) {
        s += ` with a ${this.cartItem.matWidth / 10} cm`;
        s += ` ${this.cartItem.matColor} mat`;
      }
      s += ".";
      return s;
    },
    priceText() {
      return (this.cartItem.price / 100).toFixed(2);
    },
    framingRoute() {
      return {
        path: "/framing/" + this.cartItem.artworkId,
        query: {
          printSize: this.cartItem.printSize,
          frameWidth: this.cartItem.frameWidth,
          frameStyle: this.cartItem.frameStyle,
          matWidth: this.cartItem.matWidth,
          matColor: this.cartItem.matColor,
        },
      };
    },
  },
  methods: {
    loadArtwork() {
      getArtwork(this.cartItem.artworkId)
        .then((artwork) => {
          this.artwork = artwork;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    // Function for removing cartItems by their cartItemId
    removeFromCart() {
      this.artmartStore.removeFromCart(this.cartItem.cartItemId);
    },
  },
  mounted() {
    this.loadArtwork();
  },
};
</script>

<style scoped>
.cart-item {
  margin: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.cart-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 250px;
  height: 250px;
  justify-content: center;
  flex-shrink: 0;
}

.cart-preview img {
  border: 0px solid black; /* necessary for Chrome & Firefox */
  box-shadow: 0 7px 15px 0 rgba(0, 0, 0, 0.5);
}

.cart-item .museum-label {
  margin-left: 2rem;
  position: relative;
  flex-grow: 1;
  max-width: 500px;
}

.cart-item .museum-label .price {
  font-weight: bold;
  text-align: right;
  margin-top: 1rem;
}

.cart-remove {
  width: 1.5em;
  height: 1.5em;
  padding: 0;
  margin: 0;
  border-radius: 50%;

  position: absolute;
  top: -0.75em;
  right: -0.75em;

  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-remove::before {
  content: "✕";
  font-family: sans-serif;
}

.cart-frame-description {
  margin-top: 1em;
}

.cart-price {
  font-weight: bold;
  text-align: right;
  margin-top: 1em;
}

@media (max-width: 600px) {
  .cart-item {
    flex-direction: column;
  }

  .cart-preview {
    justify-content: flex-end;
  }

  .cart-item .museum-label {
    margin: 0;
    margin-top: 2rem;
  }
}
</style>
