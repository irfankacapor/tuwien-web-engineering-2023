function cardinal(n) {
  const s = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  if (n < 0 || n >= s.length) return n;
  else return s[n];
}

function ordinal(n) {
  const s = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  if (n <= 0 || n >= s.length) return n + 'th';
  else return s[n - 1];
}

function pluralise(a, n) {
  return (n == 1 || n == -1) ? a : a + 's';
}

function capitalise(s) {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function rows(xs, indent = 2, emptyText = '(none)') {
  const s = ' '.repeat(indent);
  if (isEmpty(xs)) {
    return s + emptyText;
  } else {
    return s + Array.from(xs).join('\n' + s);
  }
}

function isEmpty(obj) {
  if ('size' in obj) {
    return obj.size == 0
  } else if (Array.isArray(obj)) {
    return obj.length == 0
  } else {
    return true;
  }
}

function xrand(obj) {
  return `<x-rand>${escapeHtml(obj.toString())}</x-rand>`;
}

function stringifyRand(obj, indent = 2, margin = 0) {
  const s = ' '.repeat(indent);
  const m = indent > 0 ? '\n' + ' '.repeat(margin) : '';
  if (obj instanceof Array) {
    let str = '[';
    str += obj.map(v => m + s + stringifyRand(v, indent, margin + indent)).join(',');
    if (obj.length > 0) str += m;
    str += ']';
    return str;
  } else if (typeof obj === 'object') {
    let str = '{';
    str += Object.entries(obj).map(([k, v]) => m + s + `"${k}": ` + stringifyRand(v, indent, margin + indent)).join(',');
    if (Object.entries(obj).length > 0) str += m;
    str += '}';
    return str;
  } else if (typeof obj === 'string') {
    return `"${xrand(obj)}"`;
  } else if (typeof obj === 'number') {
    return xrand(obj);
  } else if (typeof obj === 'boolean') {
    return xrand(obj);
  } else {
    return `${obj}`;
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
}

module.exports = {
  cardinal,
  ordinal,
  pluralise,
  capitalise,
  rows,
  xrand,
  stringifyRand,
  escapeHtml
}