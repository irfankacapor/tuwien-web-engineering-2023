<template>
  <main v-if="status == 'ready' || status == 'error'">
    <!-- This is only diplayed if the status is error-->
    <div v-if="status == 'error'" class="error-message">An error occurred during payment. Please try again.</div>
    <!---->
    
    <form class="checkout-form" id="checkout-form" v-on:submit.prevent="pay()">
      <fieldset>
        <legend>Contact information</legend>
        <div class="grid">
          <label for="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            v-model="customer.email"
            required
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Shipping address</legend>
        <div class="grid">
          <label for="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            v-model="customer.shipping_address.name"
            required
          />

          <label for="address">Address</label>
          <input
            type="text"
            name="address"
            id="address"
            v-model="customer.shipping_address.address"
            required
          />

          <label for="city">City</label>
          <input
            type="text"
            name="city"
            id="city"
            v-model="customer.shipping_address.city"
            required
          />

          <label for="country">Country</label>
          <select
          name="country"
          id="country"
          v-model="customer.shipping_address.country"
          >
          <option
          v-for = "destination in this.artmartStore.sortedDestinations"
          :key="destination.isoCode"
          :value="destination.isoCode"
          >
          {{ destination.displayName }}
          </option>
          </select>
          

          <label for="postalcode">Postal code</label>
          <input
            type="text"
            name="postalcode"
            id="postalcode"
            v-model="customer.shipping_address.postal_code"
            required
          />

          <label for="phone">Phone (optional)</label>
          <input
            type="tel"
            name="phone"
            id="phone"
            v-model="customer.shipping_address.phone"
            placeholder="+43 123456789"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Card details</legend>
        <div class="grid">
          <label for="cardholder">Name on card</label>
          <input
            type="text"
            name="cardholder"
            id="cardholder"
            v-model="card.cardholder"
            required
          />

          <label for="cardnumber">Card number</label>
          <input
            type="text"
            name="cardnumber"
            id="cardnumber"
            v-model="card.cardnumber"
            required
          />

          <label for="cardexpiry">Expiration</label>
          <input
            type="text"
            name="cardexpiry"
            id="cardexpiry"
            v-model="cardexpiry"
            pattern="\d{2}/\d{4}"
            placeholder="MM/YYYY"
            required
          />

          <label for="cardcvc">CVC</label>
          <input
            name="cardcvc"
            id="cardcvc"
            v-model.number="card.cvc"
            type="text"
            pattern="\d{3}"
            required
          />
        </div>
      </fieldset>

      <div>
        <div>
          Subtotal: €
          <span id="price-subtotal">{{ subtotal }}</span>
        </div>
        <div v-if="freeShippingPossible == true && subtotal >= freeShippingThreshold">
          Shipping Costs:
          <span id="price-shipping" :style="{ fontWeight: 'bold'}"> Free </span>
        </div>
        <div v-else>
          Shipping Costs: 
          <span id="price-shipping" :style="{ fontWeight: 'bold'}"> € {{ shippingCost }} </span>
          <div v-if="freeShippingPossible && subtotal < freeShippingThreshold" id="free-shipping-from" :style="{fontSize : 0.65}">
            (Free shipping from: €
            <!--TODO: only display 'free-shipping-from' if free shipping is possible and the threshold is not yet reached-->
            <span id="free-shipping-threshold" > {{ freeShippingThreshold }}</span>)
          </div>
        </div>
      </div>

      <div>
        <div class="checkout-total">
          Total: €
          <!-- In case free shipping is possible and threshold achieved just display the subtotal as shipping is free -->
          <span v-if="freeShippingPossible && subtotal >= freeShippingThreshold" id="price-total">{{ subtotal }}</span>
          <!-- Otherwise calculate the total including the shipping -->
          <span v-else id="price-total">{{ total }}</span>
        </div>
      </div>

      <div class="button-row">
        <router-link to="/cart">&larr; Back to Cart</router-link>
        <button type="submit" id="pay-button">Pay</button>
      </div>
    </form>
  </main>

  <main v-else-if="status == 'processing'">
    <h2>Processing payment...</h2>
    <img src="@/assets/images/spinner.gif" width="50" height="50" />
  </main>
  
  <main v-else>
    <div>Your payment was completed successfully.</div>
    <h2>Thank you for your purchase!</h2>
    <div>
      <router-link to="/search">&larr; Back to Search</router-link>
    </div>
  </main>
</template>

<script>
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";
import CartItem from "@/components/CartItem.vue";
import * as BlingService from "@/services/BlingService.js"
import * as ArtmartService from "@/services/ArtmartService";


export default {
  name: "CheckoutPage",
  components: {
    CartItem,
  },
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    subtotal(){
      // Calculate the subtotal the same way as calculated for the Cart
      return this.artmartStore.cart.reduce(
        (total, item) => total + item.price,
        0
      )/100;
    },  
    shippingCost() {
      // Calculate the shipping cost
      const destination = this.artmartStore.destinations.get(this.customer.shipping_address.country);
      return destination ? ((destination.price/100).toFixed(2)) : 0;
    },
    total(){
      // Calculate subtotal and shipping and return the sum
      const subtotal = parseFloat(this.subtotal);
      const shipping = parseFloat(((this.shippingCost)));
      return (subtotal + shipping).toFixed(2);
    },
    freeShippingThreshold(){
      // Calculate the free shipping threshold
      const destination = this.artmartStore.destinations.get(this.customer.shipping_address.country);
      return destination ? parseFloat((destination.freeShippingThreshold/100).toFixed(2)) : 0;
    },
    freeShippingPossible(){
      // Check whether free shipping is possible, return true or false
      const destination = this.artmartStore.destinations.get(this.customer.shipping_address.country);
      return destination ? destination.freeShippingPossible : false;
    },
  },
  data: function () {
    return {
      status: "ready",
      error: false,
      customer: {
        email: "",
        shipping_address: {
          name: "",
          address: "",
          city: "",
          country: "AT",
          postal_code: "",
          phone: "",
        },
      },
      card: {
        cardholder: "",
        cardnumber: "",
        cvc: null,
      },
      cardexpiry: "",
    };
  },
  mounted() {
    this.artmartStore.loadDestinations();
    // Redirect if the cart is empty
    if (this.artmartStore.cart.length === 0) {
      this.$router.push('/cart');
    }
  },
  methods: {
    async pay(){
      try{
        // Set the status to processing
        this.status="processing";
        const res = await ArtmartService.checkout(this.customer);
        // Get the expiry date of the card
        const [exp_month, exp_year] = this.cardexpiry.split('/').map(Number);
        // Pass the params to the BlingService
        const success = await BlingService.confirmPaymentIntent(res.payment_intent_id, res.client_secret, {...this.card, exp_month, exp_year});
        if (success) {
          // If the payment was succesfull set the status to success
          this.status = 'success';
          // Load the cart again
          this.artmartStore.loadCart();
        } else {
          // Otherwise throw a new error
          throw new Error('Payment failed');
        }
      }catch(error){
        // Set the status to error
        this.status = "error";
      }
    }
  }
};
</script>

<style scoped>
.error-message {
  color: red;
}

.checkout-form > div {
  margin: 1rem 0;
  text-align: right;
}

/* this is a workaround for a Chrome bug that disallows display:grid on fieldset elements */
.checkout-form div.grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-gap: 0.5em 1em;
  align-items: center;
}

.checkout-form fieldset {
  border: none;
  margin: 2rem 0;
  padding: 0;
}

.checkout-form fieldset legend {
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 0.5rem;
}

.checkout-form input {
  -moz-appearance: textfield;
  font-family: inherit;
  font-size: 1em;
  height: 1.25rem;
  line-height: 1.25rem;
  padding: 3px;
  text-indent: 1.25px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.checkout-total {
  font-size: 1.5rem;
  font-weight: bold;
}

.checkout-form .button-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#free-shipping-from {
  font-size: 0.65em;
}

@media (max-width: 600px) {
  .checkout-form {
    width: 100%;
  }
  .checkout-form label {
    margin-bottom: -0.25em;
    margin-top: 0.25em;
  }
  .checkout-form input {
    margin: 0;
  }
  .checkout-form select {
    width: 100%;
  }
  .checkout-form div.grid {
    grid-template-columns: 1fr;
  }

  .checkout-form .button-row {
    flex-direction: column-reverse;
    align-items: flex-start;
  }

  .checkout-form .button-row button {
    width: 100%;
    margin-bottom: 1em;
  }
}
</style>
