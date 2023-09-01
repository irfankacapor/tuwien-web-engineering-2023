export function cardinal(n) {
  const s = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  if (n < 0 || n >= s.length) return n;
  else return s[n];
}

export function ordinal(n) {
  const s = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  if (n <= 0 || n >= s.length) return n + 'th';
  else return s[n - 1];
}

export function pluralise(a, n) {
  return (n == 1 || n == -1) ? a : a + 's';
}

export function capitalise(s) {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

export function rows(xs, indent = 2, emptyText = '(none)') {
  const s = ' '.repeat(indent);
  if (isEmpty(xs)) {
    return s + emptyText;
  } else {
    return s + Array.from(xs).join('\n' + s);
  }
}

export function isEmpty(obj) {
  if (obj instanceof Set) {
    return obj.size == 0
  } else if (obj instanceof Array) {
    return obj.length == 0
  } else {
    return true;
  }
}

export function xrand(obj) {
  return `<x-rand>${escapeHtml(String(obj))}</x-rand>`;
}

export function xuser(obj) {
  return `<x-user>${escapeHtml(String(obj))}</x-user>`;
}

export function xdiff(obj) {
  return `<x-diff>${escapeHtml(String(obj))}</x-diff>`;
}

export function xrandkeys(ks, mark = true) {
  return (v, k) => {
    if (mark) {
      return ks.includes(k) ? xrand(v) : String(v);
    } else {
      return ks.includes(k) ? String(v) : xrand(v);
    }
  }
}

export function stringify(obj, { indent = 2, margin = 0, mark = (v, k) => escapeHtml(String(v)), _key = null, inspect = false } = {}) {
  const s = ' '.repeat(indent);
  const m = indent > 0 ? '\n' + ' '.repeat(margin) : '';
  const gap = indent > 0 ? ' ' : '';
  if (obj === null) {
    return mark('null', _key);
  } else if (obj === undefined) {
    return '(undefined)'
  } else if (Array.isArray(obj)) {
    let str = '[';
    const go = v => stringify(v, { indent, margin: margin + indent, mark, _key, inspect });
    str += obj.map(v => m + s + go(v)).join(',');
    if (obj.length > 0) str += m;
    str += ']';
    return str;
  } else if (obj instanceof Map || obj.entries instanceof Function && obj.size !== undefined) {
    if (inspect) {
      let str = `Map(${obj.size}) {`;
      str += Array.from(obj.entries()).map(([k, v]) => {
        const _key2 = (_key ? _key + '.' : '') + k;
        const vStr = stringify(v, { indent, margin: margin + indent, mark, _key: _key2, inspect })
        return m + s + `'${mark(k, _key)}' => ` + gap + vStr;
      }).join(',');
      if (obj.size > 0) str += m;
      str += '}';
      return str;
    } else {
      return '(Map)'
    }
  } else if (obj.constructor.name === 'Any') {
    return `(any ${obj.getExpectedType()})`;
  } else if (obj instanceof Date) {
    return mark(JSON.stringify(obj), _key);
  } else if (typeof obj === 'object') {
    let str = '{';
    str += Object.entries(obj).map(([k, v]) => {
      const kStr = inspect ? k : `"${k}"`;
      const _key2 = (_key ? _key + '.' : '') + k;
      const vStr = stringify(v, { indent, margin: margin + indent, mark, _key: _key2, inspect })
      return m + s + `${kStr}:` + gap + vStr;
    }).join(',');
    if (Object.entries(obj).length > 0) str += m;
    str += '}';
    return str;
  } else if (typeof obj === 'string') {
    const str = mark(obj, _key);
    return inspect ? `'${str}'` : `"${str}"`;
  } else if (typeof obj === 'number') {
    return mark(obj, _key);
  } else if (typeof obj === 'boolean') {
    return mark(obj, _key);
  } else {
    return mark(obj, _key);
  }
}

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
}

export function indentLines(n, str) {
  const s = ' '.repeat(n);
  return s + (str ? str.split('\n').join('\n' + s) : str);
}
