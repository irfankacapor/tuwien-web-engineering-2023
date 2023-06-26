<template>
  <main>
    <form role="search" class="search-form" @submit.prevent="pushQuery">
      <input
        type="search"
        v-model.trim="query"
        placeholder="Search the collection"
        aria-labelledby="search-button"
      />
      <button type="submit" id="search-button">Search</button>
    </form>
    <div class="search-info">{{ searchMessage }}</div>
    <section class="gallery">
      <gallery-item
        v-for="artwork in artworks"
        :key="artwork.id"
        :artwork="artwork"
      />
    </section>
  </main>
</template>

<script>
import * as ArtmartService from "@/services/ArtmartService";
import GalleryItem from "@/components/GalleryItem.vue";

const DEFAULT_MESSAGE = "Search our collection of more than 400,000 artworks.";

export default {
  name: "SearchPage",
  components: {
    GalleryItem,
  },
  data() {
    return {
      query: "",
      searchMessage: DEFAULT_MESSAGE,
      artworks: [],
    };
  },
  watch: {
    $route(to) {
      this.query = to.query.q;
      this.search();
    },
  },
  mounted() {
    this.query = this.$route.query.q;
    this.search();
  },
  methods: {
    pushQuery() {
      if (this.query != this.$route.query.q) {
        this.$router.push({ query: { q: this.query } });
      }
    },
    search() {
      this.artworks = [];

      if (this.query) {
        this.searchMessage = `Searching for “${this.query}”`;
      } else {
        this.searchMessage = DEFAULT_MESSAGE;
      }

      ArtmartService.getArtworks(this.query).then((artworks) => {
        this.artworks = artworks;
        if (this.query) {
          const s = this.artworks.length == 1 ? "" : "s";
          this.searchMessage = `Found ${this.artworks.length} artwork${s} for “${this.query}”`;
        }
      });
    },
  },
};
</script>

<style>
input[type="search"] {
  appearance: none;
  background-color: white;
  border: none;
  padding-left: 0.5em;
  margin: 0;
  font-family: inherit;
  font-size: 1em;
  height: 2.5rem;
  width: 100%;
}

input[type="search"]:focus {
  outline: none;
}

::placeholder {
  color: var(--primary-color);
  opacity: 0.5;
}

::-webkit-search-decoration,
::-webkit-search-cancel-button {
  appearance: none;
}
</style>

<style scoped>
.search-form {
  display: flex;
  justify-content: center;
  width: 500px;
}

@media (max-width: 600px) {
  .search-form {
    width: 100%;
    margin-top: 1rem;
  }
}

.search-info {
  font-weight: bold;
  font-size: 1.5rem;
  line-height: 1.8rem;
  margin: 3rem 0;
  text-align: center;
}

.gallery {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, 300px);
  grid-gap: 50px 50px;
  justify-content: center;
  align-items: center;
}
</style>
