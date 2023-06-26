import { xrand, escapeHtml } from './pretty';
import { Chance } from 'chance';
import path from 'path';
import cwd from 'cwd';

// TODO: fallback if file doesn't exist
const absChanceMixinPath = path.resolve(cwd(), 'chance.mixin.js');
const chanceMixin = require(absChanceMixinPath);

function test_(testId, name, fn) {
  const chance = new Chance(__SEED__ + testId).mixin(chanceMixin);
  const steps = new Steps();
  test(`${testId} - ${name}`, async () => {
    try {
      await fn(steps, chance);
    } catch (e) {
      if (global.__DEBUG_SCREENSHOTS__ ?? false) {
        if (page != null) {
          await page.screenshot({ path: `${testId}.png`, fullPage: true });
        }
      }
      let errorMessage = e.message;
      throw Error(JSON.stringify({ steps: steps.list, errorMessage }))
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

async function gotoPage(steps, url, params = {}) {
  let qs = [];
  let ps = [];
  for (let key in params) {
    qs.push(`${key}=${params[key]}`);
    ps.push(`${key}=${xrand(params[key])}`);
  }
  let q = qs.join('&');
  let p = ps.join('&');
  let c = qs.length == 0 ? '' : url.lastIndexOf('?') == -1 ? '?' : '&';
  steps.push(`navigate to <code>${url + c + p}</code>`);
  await page.goto(url + c + q, { waitUntil: 'networkidle0', timeout: 2000 });
}

async function reloadPage(steps) {
  steps.push('reload the page');
  await page.reload({ waitUntil: 'networkidle0', timeout: 2000 });
}

async function expectClick(selector, text) {
  try {
    await expect(page).toClick(selector, { text });
  } catch (e) {
    const textStr = text ? ` (with text matching "${text}")` : '';
    throw Error('Element not found: ' + selector + textStr);
  }
}

async function clickElement(steps, selector, { selectorStr = null, withText = null, textStr = null, waitForNavigation = false } = {}) {
  selectorStr = stringify(selector, selectorStr);
  textStr = withText ? ` with text matching <code>${stringify(withText, textStr)}</code>` : '';
  const waitStr = waitForNavigation ? ' and wait for navigation' : '';
  steps.push(`click <code>${selectorStr}</code>${textStr}${waitStr}`);
  if (waitForNavigation) {
    await Promise.all([
      expectClick(selector, withText),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 2000 })
    ]);
  } else {
    await expectClick(selector, withText)
  }
}

async function fillElement(steps, selector, value, { selectorStr = null, valueStr = null } = {}) {
  selectorStr = stringify(selector, selectorStr)
  valueStr = stringify(value, valueStr);
  steps.push(`type <code>${valueStr}</code> into <code>${selectorStr}</code>`);
  await expect(page).toFill(selector, value.toString());
}

async function selectOption(steps, selector, option, { selectorStr = null, optionStr = null } = {}) {
  selectorStr = stringify(selector, selectorStr);
  optionStr = stringify(option, optionStr);
  steps.push(`select the <code>${optionStr}</code> option of <code>${selectorStr}</code>`);
  await expect(page).toSelect(selector, option);
}

async function expectElementProperty(steps, selector, property, value, { selectorStr = null, propertyStr = null, valueStr = null } = {}) {
  selectorStr = stringify(selector, selectorStr);
  propertyStr = stringify(property, propertyStr);
  valueStr = stringify(value, valueStr);
  steps.push(`expect <code>${propertyStr}</code> of <code>${selectorStr}</code> to be <code>${valueStr}</code>`);
  const elem = await expect(page).toMatchElement(selector);
  const actualValue = await page.evaluate((el, prop) => el[prop], elem, property);
  try {
    expect(actualValue).toEqual(value.toString());
  } catch (e) {
    throw Error(
      `Expected ${property}: "${value.toString()}"\n\n` +
      `Actual ${property}: "${actualValue}"`
    );
  }
}

async function expectText(expectedText) {
  try {
    await expect(page).toMatch(expectedText);
  } catch (e) {
    throw Error(`Text not found: "${expectedText}"`);
  }
}

function stringify(x,f) {
  if (typeof f === 'string') {
    return f;
  } else if (typeof f === 'function') {
    return f(x);
  } else {
    return escapeHtml(x.toString());
  }
}

module.exports = {
  test_,
  gotoPage,
  reloadPage,
  clickElement,
  fillElement,
  selectOption,
  expectElementProperty,
  expectText
}
