<template>
  <div>
    <app-header />
    <router-view v-if="loaded"></router-view>
  </div>
</template>

<script>
import { RouterView } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";

export default {
  name: "App",
  components: {
    "app-header": AppHeader,
    "router-view": RouterView,
  },
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    loaded() {
      return (
        this.artmartStore.frames &&
        this.artmartStore.mats &&
        this.artmartStore.destinations
      );
    },
  },
  beforeCreate() {
    const artmartStore = useArtmartStore();
    artmartStore.loadFrames();
    artmartStore.loadMats();
    artmartStore.loadDestinations();
    artmartStore.loadCart();
  },
};
</script>

<style scoped></style>
