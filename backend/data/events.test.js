import test from 'node:test';
import assert from 'node:assert/strict';
import { events } from './events.js';

test('etkinlik tarih etiketleri kayıt tarihiyle eşleşir', () => {
  const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
  const dayFormatter = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', timeZone: 'Europe/Istanbul' });

  events.forEach((event) => {
    const value = new Date(`${event.date}T12:00:00+03:00`);
    assert.equal(Number.isNaN(value.getTime()), false, `${event.title} için geçerli tarih bekleniyor`);
    assert.equal(event.dateLabel, dateFormatter.format(value));
    assert.equal(event.day, dayFormatter.format(value));
  });
});

test('örnek takvimde geçmiş ve yaklaşan etkinlikler birlikte bulunur', () => {
  const reference = new Date('2026-08-21T00:00:00+03:00').getTime();
  assert.ok(events.some((event) => new Date(`${event.date}T23:59:59+03:00`).getTime() < reference));
  assert.ok(events.some((event) => new Date(`${event.date}T23:59:59+03:00`).getTime() >= reference));
});
