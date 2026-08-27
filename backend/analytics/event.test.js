import assert from 'node:assert/strict';
import test from 'node:test';

import { AnalyticsValidationError, classifyContentPath, normalizePageView } from './event.js';

const visitorId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';

test('ayrıntı sayfasını içerik türü ve slug ile eşler', () => {
  assert.deepEqual(classifyContentPath('/tarihi-eserler/habib-i-neccar-camii'), {
    contentType: 'monument', contentSlug: 'habib-i-neccar-camii',
  });
});

test('sayfa görüntüleme olayını kişisel veri eklemeden normalize eder', () => {
  const event = normalizePageView(
    { visitorId, sessionId, path: '/kultur-rotalari/antakya?utm=test' },
    new Date('2026-08-27T09:00:00.000Z'),
  );
  assert.equal(event.path, '/kultur-rotalari/antakya');
  assert.equal(event.contentType, 'route');
  assert.equal(event.occurredAt, '2026-08-27T09:00:00.000Z');
  assert.equal('ip' in event, false);
});

test('geçersiz anonim kimliği reddeder', () => {
  assert.throws(() => normalizePageView({ visitorId: 'bozuk', sessionId, path: '/' }), AnalyticsValidationError);
});

test('aynı oturum ve sayfanın kısa süreli tekrarını aynı anahtarla tekilleştirir', () => {
  const first = normalizePageView({ visitorId, sessionId, path: '/harita' }, new Date('2026-08-27T09:00:01.000Z'));
  const repeated = normalizePageView({ visitorId, sessionId, path: '/harita' }, new Date('2026-08-27T09:00:08.000Z'));
  assert.equal(first.dedupeKey, repeated.dedupeKey);
});
