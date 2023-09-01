import { test_, getElement } from './jest-tuwien';
import { stringify, xrand } from "./jest-tuwien/pretty";
import { mount } from '@vue/test-utils';
import { describe, expect } from "vitest"


import WidthSlider from '../src/components/framing/WidthSlider.vue';


function mountWidthSlider(steps, chance) {
  const n1 = chance.integer({ min: 0, max: 50 });
  const n2 = chance.integer({ min: n1 + 1, max: 100 });
  const x = chance.integer({ min: n1, max: n2 });
  const props = { min: n1, max: n2, modelValue: x, label: chance.word() }
  const propsStr = stringify(props, { indent: 2, mark: xrand, inspect: true })
  steps.push(
    `mount the <code>WidthSlider</code> component`,
    `The props are set to the following random values: <pre>${propsStr}</pre>`
  )
  const wrapper = mount(WidthSlider, { props: props });
  return { wrapper, props }
}

function expectFieldValue(steps, wrapper, selector, expectedValue) {
  steps.push(`expect the <code>value</code> of <code>${selector}</code> to be <code>${xrand(expectedValue)}</code>`)
  const field = getElement(wrapper, selector);
  try {
    expect(field.element.value).toEqual(expectedValue);
  } catch (e) {
    throw Error(
      `Expected value of ${selector}: ${expectedValue}\n` +
      `Actual value of ${selector}: ${field.element.value}`)
  }
}

function expectEvent(steps, wrapper, eventName, expectedPayload, i) {
  steps.push(`expect component to emit an <code>${eventName}</code> event with a payload of <code>${xrand(expectedPayload)}</code>`)
  const events = wrapper.emitted(eventName);
  try {
    expect(events).toBeTruthy();
    expect(events.length).toBeGreaterThan(i);
  } catch (e) {
    throw Error(`No ${eventName} event was emitted.`);
  }
  try {
    expect(events).toHaveLength(i + 1);
  } catch (e) {
    throw Error(`Too many ${eventName} events were emitted.\n\nExpected: 1\nDetected: ${events.length}`);
  }
  const payload = events.flat()[i];
  try {
    expect(typeof payload).toBe('number');
  } catch (e) {
    throw Error(`Expected payload of type: number\nActual payload was of type: ${typeof payload}`)
  }
  try {
    expect(payload).toBe(expectedPayload);
  } catch (e) {
    throw Error(`Expected payload: ${expectedPayload}\nActual payload: ${payload}`)
  }
}

async function setFieldValue(steps, wrapper, selector, value, triggerEvent) {
  steps.push(`set <code>value</code> of <code>${selector}</code> to <code>${xrand(value)}</code>`)
  const field = getElement(wrapper, selector);
  field.element.value = value;
  await field.trigger(triggerEvent);
}

describe('WidthSlider', () => {
  test_(101, 'Text field initial value', (steps, chance) => {
    const { wrapper, props } = mountWidthSlider(steps, chance);
    expectFieldValue(steps, wrapper, 'input[type="number"]', String(props.modelValue / 10));
  });

  test_(102, 'Range slider initial value', (steps, chance) => {
    const { wrapper, props } = mountWidthSlider(steps, chance);
    expectFieldValue(steps, wrapper, 'input[type="range"]', String(props.modelValue / 10));
  });

  test_(103, 'Text field change causes an event', async (steps, chance) => {
    const { wrapper, props } = mountWidthSlider(steps, chance);
    let maxPropsRange = props.max - props.min;
    const xs = chance.nn(chance.integer, Math.min(3, maxPropsRange), Math.min(5, maxPropsRange), { min: props.min, max: props.max });
    for (let [i, x] of xs.entries()) {
      await setFieldValue(steps, wrapper, 'input[type="number"]', String(x / 10), 'change')
      expectEvent(steps, wrapper, 'update:modelValue', x, i);
    }
  });

  test_(104, 'Range slider input causes an event', async (steps, chance) => {
    const { wrapper, props } = mountWidthSlider(steps, chance);
    let maxPropsRange = props.max - props.min;
    const xs = chance.nn(chance.integer, Math.min(3, maxPropsRange), Math.min(5, maxPropsRange), { min: props.min, max: props.max });
    for (let [i, x] of xs.entries()) {
      await setFieldValue(steps, wrapper, 'input[type="range"]', String(x / 10), 'input')
      expectEvent(steps, wrapper, 'update:modelValue', x, i);
    }
  });

  test_(105, 'Min and max bounds for value', async (steps, chance) => {
    const { wrapper, props } = mountWidthSlider(steps, chance);
    let xs = [];
    for (let i = 0; i < chance.integer({ min: 3, max: 5 }); i++) {
      if (i % 2) {
        xs[i] = [chance.integer({ min: props.max - 1, max: props.max * 100 }), props.max]
      } else {
        xs[i] = [chance.integer({ min: -100, max: props.min - 1 }), props.min]
      }
    }
    for (let [i, [x, z]] of xs.entries()) {
      await setFieldValue(steps, wrapper, 'input[type="number"]', String(x / 10), 'change')
      expectEvent(steps, wrapper, 'update:modelValue', z, i);
    }
  });

  test_(106, 'Decimal values get truncated', async (steps, chance) => {
    const { wrapper, props } = mountWidthSlider(steps, chance);
    const ys = chance.nn(chance.floating, 3, 5, { min: props.min / 10, max: props.max / 10 });
    for (let [i, y] of ys.entries()) {
      await setFieldValue(steps, wrapper, 'input[type="number"]', String(y), 'change')
      expectEvent(steps, wrapper, 'update:modelValue', Math.trunc(y * 10), i);
    }
  });

});