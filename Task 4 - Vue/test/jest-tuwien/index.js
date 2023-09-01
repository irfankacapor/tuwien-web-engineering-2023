import { SEED } from '../seed';
import { createChance } from './chance';
import { stringify, cardinal, xrand, escapeHtml, xdiff } from './pretty';
import { FormattedError } from "./formatted-error";
import { TestError } from "./reporter";
import { test, expect } from "vitest"
import { diffChars } from "diff";

export function test_(testId, name, fn) {
  const chance = createChance(SEED + testId);
  const steps = new Steps();
  test(`${testId} - ${name}`, async () => {
    try {
      await fn(steps, chance);
    } catch (e) {
      let messageType = (e instanceof FormattedError) ? "html" : "text";
      throw new TestError({ messageType, steps: steps.list, errorMessage: e.message }, { cause: e })
    }
  });
}

export class Steps {
  constructor() {
    this.list = [];
    this.group = false;
  }
  push(description, more = null) {
    if (this.group) {
      const substeps = this.list[this.list.length - 1].more.substeps;
      substeps.push({ description, more: more ? { info: more } : null });
    } else {
      this.list.push({ description, more: more ? { info: more } : null });
    }
  }
  beginGroup(description, more = null) {
    this.list.push({ description, more: { info: more, substeps: [] } });
    this.group = true;
  }
  endGroup() {
    this.group = false;
  }
}

export function expectText(wrapper, expectedText, exact = true) {
  try {
    if (exact) {
      expect(wrapper.text()).toEqual(expectedText)
    } else {
      expect(wrapper.text()).toMatch(expectedText)
    }
  } catch (e) {
    let wrapperStr;
    if (wrapper.vm) {
      wrapperStr = wrapper.vm.$options.name + ' component';
    } else {
      wrapperStr = '<' + wrapper.element.tagName.toLowerCase() + '> element';
    }

    let expectedHtmlText = "";
    let newHtmlText = "";

    // Or we could use https://github.com/vitest-dev/vitest/pull/2828
    diffChars(expectedText, wrapper.text()).forEach((part) => {
      if (part.added) {
        newHtmlText += xdiff(part.value);
      } else if (part.removed) {
        expectedHtmlText += xdiff(part.value);
      } else {
        expectedHtmlText += escapeHtml(part.value);
        newHtmlText += escapeHtml(part.value);
      }
    });

    throw new FormattedError(
      `Text not found: "${expectedHtmlText}"\n\n` +
      `Actual text of ${escapeHtml(wrapperStr)}: "${newHtmlText}"`,
      { cause: e }
    )
  }
}

export function expectPropValue(component, propName, expectedValue) {
  try {
    let value = component.props();
    for (let name of propName.split('.')) {
      value = value[name];
    }
    expect(value).toEqual(expectedValue);
  } catch (e) {
    throw Error(
      `Expected value of "${propName}" prop:\n  ` +
      stringify(expectedValue, { margin: 2 }) + '\n\n' +
      `Actual value of "${propName}" prop:\n  ` +
      stringify(component.props(propName), { margin: 2 })
    )
  }
}

export function getElement(wrapper, selector) {
  try {
    return wrapper.get(selector);
  } catch (e) {
    const wrapperStr = wrapper.vm.$options.name;
    throw Error('Unable to find ' + selector + ' within ' + wrapperStr);
  }
}

export function getComponent(wrapper, component) {
  const c = wrapper.findComponent(component);
  if (!c.exists()) {
    const wrapperStr = wrapper.vm.$options.name;
    const componentStr = component.vm.$options.name;
    const nameStr = componentStr.endsWith('Stub') ? componentStr.slice(0, -4) : componentStr;
    throw Error(`Unable to find ${nameStr} component within ${wrapperStr}.`);
  }
  return c;
}

export function getAllComponents(wrapper, component, n) {
  const cs = wrapper.findAllComponents(component);
  if (cs.length != n) {
    const componentStr = component.vm.$options.name;
    throw Error(
      `Expected to find ${cardinal(n)} ${componentStr} components.\n` +
      `Number of ${component.name} components found: ${cs.length}`
    );
  }
  return cs;
}

export async function emitEvent(steps, wrapper, component, eventName, value, { rand = true } = {}) {
  const valueStr = rand ? xrand(value) : String(value);
  const componentStr = component.vm.$options.name;
  steps.push(`emit <code>${eventName}</code> event from <code>${componentStr}</code> with value <code>${valueStr}</code>`);
  component.vm.$emit(eventName, value)
  await wrapper.vm.$nextTick();
}

export function expectLocalData(steps, wrapper, dataPath, expectedValue, { rand = true } = {}) {
  const expectedValueStr = rand ? xrand(expectedValue) : String(expectedValue);
  const wrapperStr = wrapper.vm.$options.name;
  steps.push(`expect local data <code>${dataPath}</code> of <code>${wrapperStr}</code> to have value <code>${expectedValueStr}</code>`)
  let value = wrapper.vm;
  for (let name of dataPath.split('.')) {
    value = value[name];
  }
  try {
    expect(value).toEqual(expectedValue);
  } catch (e) {
    throw Error(`Expected value of ${dataPath}: ${expectedValue}\nActual value of ${dataPath}: ${value}`);
  }
}
