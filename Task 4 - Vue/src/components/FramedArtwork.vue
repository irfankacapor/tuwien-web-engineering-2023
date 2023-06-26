<template>
  <img
    :src="artwork.image"
    alt="artwork.title"
    ref="previewImage"
    @load="onImageLoad"
  />
</template>

<script>
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";

export default {
  name: "FramedArtwork",
  props: {
    artwork: {
      image: String,
      title: String,
    },
    config: {
      printSize: String,
      frameStyle: String,
      matColor: String,
    },
  },
  data() {
    return {
      printSizes: { S: [0, 0], M: [0, 0], L: [0, 0] },
    };
  },
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    frame() {
      return this.artmartStore.frames.get(this.config.frameStyle);
    },
    mat() {
      return this.artmartStore.mats.get(this.config.matColor);
    },
  },
  watch: {
    config: {
      deep: true,
      handler() {
        this.renderPreview();
      },
    },
  },
  methods: {
    onImageLoad() {
      this.calculatePrintSizes();
      this.renderPreview();
    },
    calculatePrintSizes() {
      const img = this.$refs.previewImage;
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      let S = [297, 297]; // A4
      let M = [420, 420]; // A3
      let L = [594, 594]; // A2

      if (h > w) {
        S[0] = Math.floor((w * S[1]) / h);
        M[0] = Math.floor((w * M[1]) / h);
        L[0] = Math.floor((w * L[1]) / h);
      } else {
        S[1] = Math.floor((h * S[0]) / w);
        M[1] = Math.floor((h * M[0]) / w);
        L[1] = Math.floor((h * L[0]) / w);
      }

      this.printSizes = { S, M, L };
      this.$emit("print-sizes", this.printSizes);
    },
    renderPreview() {
      const img = this.$refs.previewImage;
      const container = img.parentNode;

      const [w, h] = this.printSizes[this.config.printSize];
      const matWidth = this.config.matWidth;
      const frameWidth = this.config.frameWidth;

      let x;
      if (w > h) {
        x = container.offsetWidth / (w + 2 * matWidth + 2 * frameWidth);
      } else {
        x = container.offsetHeight / (h + 2 * matWidth + 2 * frameWidth);
      }

      img.style.boxSizing = "border-box";
      img.width = (w + 2 * matWidth + 2 * frameWidth) * x;
      img.height = (h + 2 * matWidth + 2 * frameWidth) * x;
      img.style.borderImageSource = `url(${this.frame.borderImage}`;
      img.style.borderImageSlice = this.frame.slice;
      img.style.borderWidth = `${frameWidth * x}px`;
      img.style.backgroundColor = this.mat.hex;
      img.style.padding = `${matWidth * x}px`;
    },
  },
};
</script>

<style scoped>
img {
  border: 0px solid black; /* necessary for Chrome & Firefox */
}
</style>
