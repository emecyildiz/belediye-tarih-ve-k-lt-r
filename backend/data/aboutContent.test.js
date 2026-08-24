import test from 'node:test';
import assert from 'node:assert/strict';
import { aboutContent, getAboutContent } from './aboutContent.js';

test('hakkında sayfasının bütün içerik bölümleri veri katmanından gelir', () => {
  const content = getAboutContent();
  assert.equal(content.status, 'published');
  assert.ok(content.hero.title && content.hero.backgroundImage);
  assert.equal(content.summary.length, 4);
  assert.equal(content.capabilities.items.length, 4);
  assert.equal(content.guide.steps.length, 4);
  assert.equal(content.municipality.goals.length, 4);
});

test('hakkında içeriği tüketiciye kopya olarak verilir', () => {
  const content = getAboutContent();
  content.hero.title = 'Değiştirildi';
  assert.notEqual(content.hero.title, aboutContent.hero.title);
});
