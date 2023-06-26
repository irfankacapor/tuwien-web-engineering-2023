<template>
  <div class="museum-label">
    <span class="artist">{{artwork.artist}}</span>
    <span class="title">{{artwork.title}}</span>,
    <span class="date">{{artwork.date}}</span>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "MuseumLabel",
  props: {
    artwork: {
      artist: String,
      title: String,
      date: String
    }
  }
};
</script>

<style scoped>
.artist {
  display: block;
  font-weight: bold;
}

.title {
  font-style: italic;
}
</style>