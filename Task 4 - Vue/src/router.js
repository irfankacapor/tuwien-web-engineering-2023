import { createRouter, createWebHistory } from 'vue-router'

import SearchPage from "@/pages/SearchPage.vue";
import CartPage from "@/pages/CartPage.vue";
import FramingPage from "@/pages/FramingPage.vue";
import CheckoutPage from "@/pages/CheckoutPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/search' },
    { path: '/search', component: SearchPage },
    { path: '/cart', component: CartPage },
    { path: '/checkout', component: CheckoutPage },
    { path: '/framing/:artworkId', component: FramingPage, props: (route) => ({ artworkId: +route.params.artworkId }) },
    // catch all and redirect to home
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

export default router