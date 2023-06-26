<template>
  <fieldset>
    <legend>Print Size</legend>
    <div class="segmented">
      <input
        type="radio"
        name="printSize"
        id="print-size-s"
        value="S"
        v-model="selected"
      />
      <label for="print-size-s">
        Small
        <br />
        {{ printSizes.S[0] / 10 }} × {{ printSizes.S[1] / 10 }} cm
      </label>
      <input
        type="radio"
        name="printSize"
        id="print-size-m"
        value="M"
        v-model="selected"
      />
      <label for="print-size-m">
        Medium
        <br />
        {{ printSizes.M[0] / 10 }} × {{ printSizes.M[1] / 10 }} cm
      </label>
      <input
        type="radio"
        name="printSize"
        id="print-size-l"
        value="L"
        v-model="selected"
      />
      <label for="print-size-l">
        Large
        <br />
        {{ printSizes.L[0] / 10 }} × {{ printSizes.L[1] / 10 }} cm
      </label>
    </div>
  </fieldset>
</template>

<script>
export default {
  name: "PrintSizePicker",
  props: {
    modelValue: String,
    printSizes: {
      S: Array,
      M: Array,
      L: Array,
    },
  },
  computed: {
    selected: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        this.$emit("update:modelValue", newValue);
      },
    },
  },
};
</script>

<style scoped>
.segmented {
  display: flex;
  height: 3em;
}

.segmented input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin: 0;
  border-style: none;
}

.segmented label {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  opacity: 0.5;
}

.segmented input:checked + label {
  font-weight: bold;
  opacity: 1;
}
</style>
