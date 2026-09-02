import assert from 'node:assert/strict';
import test from 'node:test';

import { createRateLimit } from '../security/rateLimit.js';

function runMiddleware(middleware) {
  const headers = new Map();
  const response = {
    statusCode: 200,
    setHeader(name, value) { headers.set(name, value); },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let continued = false;
  middleware({ socket: { remoteAddress: '127.0.0.1' } }, response, () => { continued = true; });
  return { continued, headers, response };
}

test('istek sınırı aşıldığında 429 ve yeniden deneme süresi döner', () => {
  const middleware = createRateLimit({ limit: 2, windowMs: 60_000 });
  assert.equal(runMiddleware(middleware).continued, true);
  assert.equal(runMiddleware(middleware).continued, true);
  const blocked = runMiddleware(middleware);
  assert.equal(blocked.continued, false);
  assert.equal(blocked.response.statusCode, 429);
  assert.ok(Number(blocked.headers.get('Retry-After')) >= 1);
});
