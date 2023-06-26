<template>
  <main>
    <section class="cart">
      <div v-if="artmartStore.cart.length === 0">
        There are no items in your shopping cart.
      </div>
      <cart-item
        v-for="cartItem in artmartStore.cart"
        :key="cartItem.cartItemId"
        :cart-item="cartItem"
      />
      <div class="cart-total">
        <div v-if="artmartStore.cart.length > 0" class="price">Total: € {{ (totalPrice / 100).toFixed(2) }}</div>
        <router-link to="/checkout" tag="button" class="cart-checkout">
          Checkout
        </router-link>
      </div>
    </section>
  </main>
</template>

<script>
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";
import CartItem from "@/components/CartItem.vue";
export default {

  name: "CartPage",
  components: {
    CartItem,
  },
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    totalPrice(){
      // Compute the total price
      return this.artmartStore.cart.reduce(
        (total, item) => total + item.price,
        0
      );
    },  
  },
};

</script>

<style scoped>
.cart {
  display: flex;
  flex-direction: column;
}

.cart-total {
  align-self: flex-end;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem;
  text-align: right;
}

.cart-checkout {
  align-self: flex-end;
  margin-top: 1em;
  font-size: 1rem;
}

@media (max-width: 600px) {
  .cart-total {
    align-self: stretch;
    text-align: center;
  }

  .cart-checkout {
    align-self: stretch;
    width: 100%;
  }
}
</style>
