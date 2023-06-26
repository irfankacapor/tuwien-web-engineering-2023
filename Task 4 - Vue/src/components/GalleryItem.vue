<template>
  <div class="thumb">
    <router-link :to="'/framing/' + artwork.artworkId">
      <img :src="artwork.image" :alt="artwork.title" />
      <museum-label :artwork="artwork" />
    </router-link>
  </div>
</template>

<script>
import MuseumLabel from "@/components/MuseumLabel.vue";

export default {
  name: "GalleryItem",
  components: {
    MuseumLabel,
  },
  props: {
    artwork: {
      artworkId: Number,
      artist: String,
      title: String,
      date: String,
      image: String,
    },
  },
};
</script>

<style scoped>
.thumb {
  width: 300px;
}

.thumb a {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumb img {
  max-width: 300px;
  max-height: 300px;
  box-shadow: 0 7px 15px 0 rgba(0, 0, 0, 0.5);
  transition: all 0.5s;
}

.thumb a:hover img {
  box-shadow: 0 30px 60px 0 rgba(0, 0, 0, 0.5);
  transform: scale(1.1);
}

@media (hover: none) {
  .thumb a:hover img {
    transform: none;
  }
}

.thumb .museum-label {
  margin-top: 1rem;
}
</style>
