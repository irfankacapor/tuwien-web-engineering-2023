import { stringify } from './pretty';
import { createChance } from './chance';
import http from 'http';

export function test_(testId, name, fn) {
  const chance = createChance(__SEED__ + testId);
  const steps = new Steps();
  test(`${testId} - ${name}`, async () => {
    try {
      await fn(steps, chance);
    } catch (e) {
      let errorMessage = e.message;
      throw Error(JSON.stringify({ steps: steps.list, errorMessage }), { cause: e })
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

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const clientRequest = http.request(options, incomingMessage => {
      let response = {
        statusCode: incomingMessage.statusCode,
        statusMessage: incomingMessage.statusMessage,
        rawHeaders: incomingMessage.rawHeaders,
        headers: incomingMessage.headers,
        body: []
      };
      incomingMessage.on('data', (chunk) => {
        response.body.push(chunk);
      });
      incomingMessage.on('end', () => {
        response.body = response.body.join('');
        resolve(response);
      });
    });
    clientRequest.on('error', (e) => {
      reject(e);
    });
    clientRequest.on('timeout', () => {
      clientRequest.destroy(new Error('Request timeout'));
    });
    if (body) {
      clientRequest.write(body);
    }
    clientRequest.end();
  });
}

function prettyHttpRequest(options, body, {
  pathStr = null, headerStr = {}, bodyStr = null
} = {}) {
  let str = `${options.method} ${pathStr ?? options.path} HTTP/1.1\n`
  str += `Host: ${options.host}:${options.port}\n`;
  for (let key in options.headers) {
    const val = headerStr[key] ?? options.headers[key];
    str += key + ': ' + val + '\n';
  }
  if (body) {
    str += '\n' + bodyStr ?? body;
  }
  return str;
}

function prettyHttpResponse(res) {
  let str = `HTTP/1.1 ${res.statusCode} ${res.statusMessage}\n`;
  for (let i = 0; i < res.rawHeaders.length; i += 2) {
    str += res.rawHeaders[i] + ': ' + res.rawHeaders[i + 1] + '\n';
  }
  if (res.body) {
    str += '\n';
    if (res.body.includes('\0')) {
      str += '<i>(binary data not shown in test report)</i>'
    } else {
      str += res.body;
    }
  }
  return str;
}

export async function sendHttpRequest(steps, {
  method = 'GET', host = 'localhost', port = 80,
  path = '/', pathStr = null,
  cookie = null, cookieStr = null,
  jsonBody = null, jsonBodyStr = null,
  jsonBodyIndent = 2
} = {}) {
  let options = {
    method: method,
    host: host,
    port: port,
    path: path,
    timeout: 1000,
    headers: {}
  }
  if (cookie) {
    options.headers['Cookie'] = cookie;
  }

  let body = null;
  if (jsonBody) {
    body = JSON.stringify(jsonBody, null, jsonBodyIndent);
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(body);
  }

  let reqMsg = `send <code>${method}</code> request to <code>${pathStr ?? path}</code>`;
  if (cookie != null || jsonBody != null) reqMsg += ' with ';
  if (cookie) reqMsg += 'cookie';
  if (cookie != null && jsonBody != null) reqMsg += ' and ';
  if (jsonBody) reqMsg += 'JSON payload';

  let headerStr = {}
  if (cookie) {
    headerStr['Cookie'] = cookieStr;
  }
  let reqInfo = prettyHttpRequest(options, jsonBody, {
    pathStr, headerStr, bodyStr: jsonBodyStr ?? JSON.stringify(jsonBody, null, jsonBodyIndent)
  });

  steps.push(reqMsg, `<pre>${reqInfo}</pre>`);
  let res = await httpRequest(options, body);
  steps.push(`receive response`, `<pre>${prettyHttpResponse(res)}</pre>`);
  return res;
}

export function expectStatus(steps, res, status) {
  let statusStr = status + ' ' + http.STATUS_CODES[status] ?? ''
  steps.push(`expect response status to be <code>${statusStr}</code>`);
  if (res.statusCode != status) {
    throw Error(`Expected: ${statusStr}\nReceived: ${res.statusCode} ${res.statusMessage}`);
  }
}

export function expectBodyJSON(steps, res) {
  steps.push(`expect response to contain JSON payload`);
  if (!(/application\/json/.test(res.headers['content-type']))) {
    throw Error(
      'Expected:\n  Content-Type: application/json\n\n' +
      'Received:\n  Content-Type: ' + res.headers['content-type']
    )
  }
  return JSON.parse(res.body);
}

export function expectEquality(received, expected) {
  try {
    expect(received).toEqual(expected);
  } catch (e) {
    let isSet = false;
    if (received instanceof Set) {
      received = Array.from(received);
      isSet = true;
    }
    if (expected instanceof Set) {
      expected = Array.from(expected);
      isSet = true;
    }
    let orderInfo = isSet ? '\n\n(The order of items does not matter.)' : '';
    throw Error(
      'Expected:\n  ' + stringify(expected, { margin: 2 }) + '\n\n' +
      'Received:\n  ' + stringify(received, { margin: 2 }) + orderInfo
    );
  }
}
