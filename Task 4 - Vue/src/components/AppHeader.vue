<template>
  <header>
    <router-link to="/search">
      <img src="@/assets/images/artmart_logo.png" alt="Artmart" class="logo" />
    </router-link>
    <nav v-if="!isCheckout()">
      <router-link to="/search">Search</router-link>
      <router-link to="/cart" id="cart-link"
        >Cart{{ cartSizeText }}</router-link
      >
    </nav>
  </header>
</template>

<script>
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";

export default {
  name: "AppHeader",
  methods: {
    isCheckout: function () {
      return this.$route.path == "/checkout";
    },
  },
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    cartSizeText: function () {
      const count = this.artmartStore.cart.length;
      return count > 0 ? ` (${count})` : "";
    },
  },
};
</script>

<style>
header {
  font-size: 2rem;
  height: 3rem;
  padding: 1em 2em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  height: 1.5em;
}

.logo img {
  height: 100%;
}

nav {
  text-align: right;
}

nav a {
  margin-left: 1em;
}

nav a:hover {
  border-bottom: 2px solid var(--primary-color);
}

@media (max-width: 600px) {
  header {
    font-size: 1rem;
    height: 2rem;
  }

  nav a:hover {
    border-bottom: 1px solid var(--primary-color);
  }
}
</style>
