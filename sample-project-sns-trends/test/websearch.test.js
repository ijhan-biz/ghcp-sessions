import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapResultsToPosts, createWebSearchFetcher } from '../src/fetchers/webSearch.js';
import { searchPosts, rankTrends } from '../src/trends.js';

// 실제 네트워크 없이 주입된 fake fetch로 웹 검색 어댑터를 결정론 검증한다.

test('mapResultsToPosts: Brave 형태 응답을 post로 매핑', () => {
  const data = { web: { results: [
    { title: '신제품 #ai', description: '발표 #tech', age: '2026-07-05T00:00:00Z' },
    { title: '#ai 튜토리얼', description: '' },
  ] } };
  const posts = mapResultsToPosts(data);
  assert.equal(posts.length, 2);
  assert.equal(posts[0].text, '신제품 #ai 발표 #tech');
  assert.equal(posts[0].likes, 0);
  assert.equal(posts[0].createdAt, '2026-07-05T00:00:00.000Z');
});

test('mapResultsToPosts: 알 수 없는 형태 → 빈 배열(방어)', () => {
  assert.deepEqual(mapResultsToPosts(null), []);
  assert.deepEqual(mapResultsToPosts({ nope: 1 }), []);
});

test('createWebSearchFetcher: 키/엔드포인트 없으면 null(폴백 유도)', () => {
  assert.equal(createWebSearchFetcher({}), null);
  assert.equal(createWebSearchFetcher({ apiKey: 'x' }), null);
});

test('createWebSearchFetcher: 주입 fetch로 검색→매핑, searchPosts와 결합', async () => {
  const fakeHttp = async () => ({
    ok: true,
    json: async () => ({ results: [{ name: '#ai 소식', snippet: '많이 언급 #ai' }] }),
  });
  const webFetch = createWebSearchFetcher({ apiKey: 'k', endpoint: 'https://example.test/search', fetch: fakeHttp });
  assert.equal(typeof webFetch, 'function');

  const posts = await searchPosts('#ai', { fetch: webFetch });
  assert.equal(posts.length, 1);
  const trends = rankTrends(posts, { topN: 5 });
  assert.equal(trends[0].tag, 'ai');
});

test('createWebSearchFetcher: HTTP 실패(ok=false) → 빈 배열(안전)', async () => {
  const fakeHttp = async () => ({ ok: false, json: async () => ({}) });
  const webFetch = createWebSearchFetcher({ apiKey: 'k', endpoint: 'https://example.test/search', fetch: fakeHttp });
  assert.deepEqual(await webFetch('q'), []);
});
