<template>
  <fieldset>
    <legend>Mat Color</legend>
    <div class="mat-color-row">
      <div class="mat-color-item" v-for="mat in mats" :key="mat.color">
        <input
          type="radio"
          :id="inputId(mat)"
          name="matColor"
          :value="mat.color"
          :style="{ backgroundColor: mat.hex }"
          v-model="selected"
        />
        <label :for="inputId(mat)">{{ mat.label }}</label>
      </div>
    </div>
  </fieldset>
</template>

<script>
import { mapStores } from "pinia";
import { useArtmartStore } from "@/store";

export default {
  name: "MatColorPicker",
  props: ["modelValue"],
  computed: {
    artmartStore: mapStores(useArtmartStore).artmartStore,
    mats() {
      return this.artmartStore.sortedMats;
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
    inputId: (mat) => "mat-color-" + mat.style,
  },
};
</script>

<style scoped>
.mat-color-row {
  display: flex;
  justify-content: space-evenly;
  align-items: baseline;
  text-align: center;
  margin-left: -20px;
  margin-right: -20px;
  overflow-x: hidden;
}

.mat-color-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0 10px 0 10px;
}

.mat-color-item:first-of-type {
  padding-left: 20px;
}

.mat-color-item:last-of-type {
  padding-right: 20px;
}

.mat-color-item input {
  appearance: none;
  cursor: pointer;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  border: 2px solid #eff2f5;
  margin: 0 0 5px 0;
  align-self: center;
  opacity: 0.5;
}

.mat-color-item input:checked {
  border: 2px solid #2b2e32;
  opacity: 1;
}

.mat-color-item input:focus {
  outline: none;
}

.mat-color-item label {
  cursor: pointer;
  opacity: 0.5;
  padding-top: 0.25em;
}

.mat-color-item input:checked + label {
  font-weight: bold;
  opacity: 1;
}
</style>
