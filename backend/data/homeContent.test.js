import test from 'node:test';
import assert from 'node:assert/strict';
import { getHomeContent, homeContent } from './homeContent.js';

test('ana sayfa vitrini birden fazla veri tabanlı slayt içerir', () => {
  const content = getHomeContent();
  assert.ok(content.heroSlides.length >= 4);
  assert.ok(content.heroSlides.every((slide) => slide.id && slide.image && slide.title && slide.actionHref));
  assert.ok(content.quickActions.every((action) => action.icon && action.href));
});

test('ana sayfa içeriği tüketiciye kopya olarak verilir', () => {
  const content = getHomeContent();
  content.heroSlides[0].title = 'Değiştirildi';
  assert.notEqual(content.heroSlides[0].title, homeContent.heroSlides[0].title);
});
