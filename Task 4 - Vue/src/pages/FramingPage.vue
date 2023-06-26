
<template>
  
  <main class="framing-main">
    <div class="framing-preview" v-if="artwork">
      <framed-artwork
        :artwork="artwork"
        :config="config"
        @print-sizes="printSizes = $event"
      />
      <museum-label :artwork="artwork" />
    </div>

    <form class="framing-form museum-label" @submit.prevent>
      <!-- Instantiate the components -->
      <print-size-picker v-model="config.printSize" :printSizes="printSizes" />
      <width-slider v-model="config.frameWidth" label="Frame" :min="20" :max="50" />
      <frame-style-picker v-model="config.frameStyle" />
      <width-slider v-model="config.matWidth" label="Mat" :min="0" :max="100" />
      <mat-color-picker v-model="config.matColor" />

      <fieldset>
        <legend>Price</legend>
        <div class="framing-form-row">
          <label for="price">Price (excl. shipping)</label>
          <div>
            <!-- Set the price to the calculated price -->
            <span class="price" id="price">€ {{ priceText }}</span>
          </div>
        </div>
        <div class="framing-form-row">
          <label for="total-size">Total Size (incl. frame and mat)</label>
          <div id="total-size">{{ totalSizeText }} cm</div>
        </div>
        <button type="submit" class="buy" @click="addToCart"> <!-- Bind button to addToCart function -->
          Add to Cart
        </button>
      </fieldset>
    </form>
  </main>
</template>

<script>
// Imported the needed components
import WidthSlider from "@/components/framing/WidthSlider.vue";
import FrameStylePicker from "@/components/framing/FrameStylePicker.vue";
import MatColorPicker from "@/components/framing/MatColorPicker.vue";
import * as ArtmartService from "@/services/ArtmartService";
import FramedArtwork from "@/components/FramedArtwork.vue";
import MuseumLabel from "@/components/MuseumLabel.vue";
import PrintSizePicker from "@/components/framing/PrintSizePicker.vue";
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";

export default {
  name: "FramingPage",
  // Add the new components to the components
  components: {
  FramedArtwork,
  MuseumLabel,
  PrintSizePicker,
  WidthSlider,
  FrameStylePicker,
  MatColorPicker,
  },
  props: {
    artworkId: Number,
  },
  data: function () {
    const artmartStore = useArtmartStore();
    return {
      artwork: null,
      printSizes: { S: [0, 0], M: [0, 0], L: [0, 0] },
      config: {
        printSize: "M",
        frameWidth: 40,
        frameStyle: artmartStore.sortedFrames[0].style,
        matWidth: 55,
        matColor: artmartStore.sortedMats[0].color,
      },
    };
  },
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    frame() {
      return this.artmartStore.frames.get(this.config.frameStyle);
    },
    price() {
      const cF = this.config.frameWidth * this.frame.cost;
      const cM = this.config.matWidth * 5;
      const s = { S: 1, M: 2, L: 3 }[this.config.printSize];
      return (3500 + cF + cM) * s;
    },
    priceText() {
      return (this.price / 100).toFixed(2);
    },
    totalSize() {
      const [w, h] = this.printSizes[this.config.printSize];
      const x = 2 * this.config.frameWidth + 2 * this.config.matWidth;
      return [w + x, h + x];
    },
    totalSizeText() {
      const [w, h] = this.totalSize;
      return (w / 10).toFixed(1) + " × " + (h / 10).toFixed(1);
    },
  },
  mounted() {
    ArtmartService.getArtwork(this.artworkId).then((artwork) => {
      if (artwork == null) {
        this.$router.replace({ path: "/search" });
      }
      this.artwork = artwork;
    });

    const clamp = (x, min, max) => Math.trunc(Math.min(Math.max(x, min), max));

    const query = this.$route.query;
    if (["S", "M", "L"].includes(query.printSize)) {
      this.config.printSize = query.printSize;
    }
    if (isFinite(+query.frameWidth)) {
      this.config.frameWidth = clamp(+query.frameWidth, 20, 50);
    }
    const frameStyles = this.artmartStore.sortedFrames.map((x) => x.style);
    if (frameStyles.includes(query.frameStyle)) {
      this.config.frameStyle = query.frameStyle;
    }
    if (isFinite(+query.matWidth)) {
      this.config.matWidth = clamp(+query.matWidth, 0, 100);
    }
    const matColors = this.artmartStore.sortedMats.map((x) => x.color);
    if (matColors.includes(query.matColor)) {
      this.config.matColor = query.matColor;
    }
  },
  watch: {
    config: {
      deep: true,
      handler() {
        const q = this.$route.query;
        const c = this.config;
        if (
          q.frameWidth != c.frameWidth ||
          q.matWidth != c.matWidth ||
          q.frameStyle != c.frameStyle ||
          q.matColor != c.matColor ||
          q.printSize != c.printSize
        ) {
          this.$router.replace({ query: this.config });
        }
      },
    },
  },
  methods: {
    addToCart: function () {
      const product = { artworkId: this.artwork.artworkId, ...this.config };
      this.artmartStore.addToCart(product).then((ok) => {
        if (ok) {
          this.$router.push({ path: "/cart" });
        }
      });
    },
  },
};
</script>

<style>
.framing-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.framing-form fieldset {
  border: none;
  min-width: auto;
  border-bottom: 1px solid var(--bg-color);
  padding: 15px 20px 15px 20px;
  margin: 0;
}

.framing-form fieldset:last-of-type {
  border-bottom: none;
  display: flex;
  flex-direction: column;
}

/* legend is necessary for accessibility, but we don't want to show it */
.framing-form fieldset legend {
  position: absolute;
  clip: rect(0 0 0 0);
}
</style>

<style scoped>
.framing-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  max-height: 500px;
  min-width: 250px;
  flex: 1 1 250px;
  margin: 2rem 50px;
}

.framing-preview img {
  border: 0px solid black; /* necessary for Chrome & Firefox */
  box-shadow: 0px 30px 60px 0px rgba(0, 0, 0, 0.5);
}

.framing-preview .museum-label {
  margin-top: 1rem;
}

.framing-form {
  width: 400px;
  padding: 0;
}

.framing-form-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  line-height: 1.5em;
}

.framing-form-row .price {
  font-weight: bold;
  font-size: 1.5rem;
}

.framing-form button.buy {
  margin-top: 0.5em;
  width: 100%;
}

@media (max-width: 600px) {
  .framing-main {
    flex-direction: column;
    margin: 0;
  }

  .preview {
    width: 90%;
    flex: 0 0 auto;
    margin-left: 0;
    margin-right: 0;
  }

  .framing-form {
    width: 100%;
    box-shadow: none;
    padding: 0;
  }
}
</style>
