import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideCollected } from '../src/collect.js';

// 실데이터 소스가 있으면 결과가 비어도 샘플로 폴백하지 않는다(태그는 실제 검색 결과 기반).

test('실소스 有 + 결과 有 → 실데이터 사용', () => {
  const r = decideCollected({ realSource: 'mastodon', realPosts: [{ text: '#ai' }], samplePosts: [{ text: '#x' }] });
  assert.equal(r.source, 'mastodon');
  assert.equal(r.posts.length, 1);
  assert.equal(r.posts[0].text, '#ai');
});

test('실소스 有 + 결과 空 → 실소스 유지(샘플로 폴백하지 않음)', () => {
  const r = decideCollected({ realSource: 'mastodon', realPosts: [], samplePosts: [{ text: '#x' }] });
  assert.equal(r.source, 'mastodon');
  assert.deepEqual(r.posts, []); // 빈 결과 그대로 — 샘플 아님
});

test('실소스 有(web) + 결과 空 → web 유지', () => {
  const r = decideCollected({ realSource: 'web', realPosts: [], samplePosts: [{ text: '#x' }] });
  assert.equal(r.source, 'web');
  assert.deepEqual(r.posts, []);
});

test('실소스 없음 → 샘플 사용', () => {
  const r = decideCollected({ realSource: null, realPosts: [], samplePosts: [{ text: '#x' }] });
  assert.equal(r.source, 'sample');
  assert.equal(r.posts.length, 1);
});
