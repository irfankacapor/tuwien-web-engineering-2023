<template>
  <fieldset>
    <legend>Frame Style</legend>
    <div class="frame-style-row">
      <div class="frame-style-item" v-for="frame in frames" :key="frame.style">
        <input
          type="radio"
          :id="inputId(frame)"
          name="frameStyle"
          :value="frame.style"
          v-model="selected"
        />
        <label :for="inputId(frame)">
          <img :src="frame.thumbImage" :alt="frame.label" />
          {{ frame.label }}
        </label>
      </div>
    </div>
  </fieldset>
</template>

<script>
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";

export default {
  name: "FrameStylePicker",
  props: ["modelValue"],
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    frames() {
      return this.artmartStore.sortedFrames;
    },
    selected: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        this.$emit("update:modelValue", newValue);
      },
    },
  },
  methods: {
    inputId: (frame) => "frame-style-" + frame.style,
  },
};
</script>

<style scoped>
.frame-style-row {
  display: flex;
  justify-content: space-evenly;
  align-items: baseline;
  text-align: center;
  margin-left: -20px;
  margin-right: -20px;
  overflow-x: hidden;
}

.frame-style-item {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100px;
}

.frame-style-item:first-of-type {
  padding-left: 20px;
}

.frame-style-item:last-of-type {
  padding-right: 20px;
}

.frame-style-item img {
  height: 50px;
  transform: rotate(45deg);
  margin: 0px 20px 0px 20px;
}

.frame-style-item input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin: 0;
  padding: 0;
  border-style: none;
}

.frame-style-item label {
  cursor: pointer;
  opacity: 0.4;
  line-height: 2em;
}

.frame-style-item input:checked + label {
  opacity: 1;
  font-weight: bold;
}

@media (max-width: 600px) {
  .frame-style-item {
    height: 75px;
  }
  .frame-style-item img {
    transform: rotate(45deg) scale(0.75);
  }
  .frame-style-item label {
    line-height: 1em;
  }
}
</style>
