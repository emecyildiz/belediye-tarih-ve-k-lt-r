import test from 'node:test';
import assert from 'node:assert/strict';

import { waitForPayloadContent } from '../services/cms/payloadStartup.js';
import { requestWithTransientRetry } from '../../src/services/apiRetry.js';

test('Payload başlangıcı geçici hatalardan sonra hazır olana kadar bekler', async () => {
  let calls = 0;
  const retries = [];
  const status = await waitForPayloadContent({
    load: async () => {
      calls += 1;
      if (calls < 3) throw new Error('CMS hazırlanıyor');
      return { ready: true, counts: { monuments: 20 } };
    },
    maxAttempts: 4,
    retryDelayMs: 1,
    sleep: async () => {},
    onRetry: ({ attempt }) => retries.push(attempt),
  });

  assert.equal(calls, 3);
  assert.deepEqual(retries, [1, 2]);
  assert.equal(status.ready, true);
  assert.equal(status.startupAttempts, 3);
});

test('Payload başlangıcı deneme sınırında açık bir hata üretir', async () => {
  await assert.rejects(
    waitForPayloadContent({ load: async () => { throw new Error('bağlantı yok'); }, maxAttempts: 2, sleep: async () => {} }),
    /2 denemede hazırlanamadı: bağlantı yok/,
  );
});

test('okuma isteği geçici 503 yanıtından sonra yeniden denenir', async () => {
  let calls = 0;
  const response = await requestWithTransientRetry(async () => {
    calls += 1;
    return { status: calls < 3 ? 503 : 200 };
  }, { attempts: 4, sleep: async () => {} });

  assert.equal(calls, 3);
  assert.equal(response.status, 200);
});

test('okuma isteği kalıcı istemci hatasını yeniden denemez', async () => {
  let calls = 0;
  const response = await requestWithTransientRetry(async () => {
    calls += 1;
    return { status: 404 };
  }, { sleep: async () => {} });

  assert.equal(calls, 1);
  assert.equal(response.status, 404);
});
