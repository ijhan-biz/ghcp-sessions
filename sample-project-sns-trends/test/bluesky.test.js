import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapBlueskyPosts, createBlueskyFetcher } from '../src/fetchers/bluesky.js';
import { searchPosts, rankTrends } from '../src/trends.js';

// 실제 네트워크 없이 주입된 fake fetch로 Bluesky 공개 API 어댑터를 결정론 검증한다.

test('mapBlueskyPosts: searchPosts 응답 → post 매핑', () => {
  const data = { posts: [
    { record: { text: '#ai 소식', createdAt: '2026-07-05T00:00:00Z', langs: ['ko'] }, likeCount: 10, repostCount: 3 },
    { record: { text: '', createdAt: '2026-07-04T00:00:00Z' }, likeCount: 0, repostCount: 0 }, // 빈 텍스트 제외
  ] };
  const posts = mapBlueskyPosts(data);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].text, '#ai 소식');
  assert.equal(posts[0].likes, 10);
  assert.equal(posts[0].reposts, 3);
  assert.equal(posts[0].createdAt, '2026-07-05T00:00:00Z');
  assert.equal(posts[0].language, 'ko');
});

test('mapBlueskyPosts: 비배열/누락 방어', () => {
  assert.deepEqual(mapBlueskyPosts(null), []);
  assert.deepEqual(mapBlueskyPosts({}), []);
});

test('createBlueskyFetcher: 빈 검색어면 호출 없이 빈 배열', async () => {
  let called = 0;
  const fakeHttp = async () => { called++; return { ok: true, json: async () => ({ posts: [] }) }; };
  const fetcher = createBlueskyFetcher({ fetch: fakeHttp });
  assert.deepEqual(await fetcher(''), []);
  assert.equal(called, 0);
});

test('createBlueskyFetcher: 키워드 검색 URL + 매핑, searchPosts와 결합', async () => {
  let calledUrl = '';
  const fakeHttp = async (url) => {
    calledUrl = url;
    return { ok: true, json: async () => ({ posts: [{ record: { text: '#ai 실시간', createdAt: '2026-07-05T00:00:00Z', langs: ['ko'] }, likeCount: 5, repostCount: 1 }] }) };
  };
  const fetcher = createBlueskyFetcher({ service: 'https://public.api.bsky.app', fetch: fakeHttp });
  const posts = await searchPosts('#ai', { fetch: fetcher });
  assert.match(calledUrl, /\/xrpc\/app\.bsky\.feed\.searchPosts\?/);
  assert.match(calledUrl, /q=%23ai/);
  assert.equal(posts.length, 1);
  assert.equal(rankTrends(posts, { topN: 5 })[0].tag, 'ai');
});

test('createBlueskyFetcher: cursor 페이지네이션', async () => {
  const mk = (n, txt) => Array.from({ length: n }, (_, i) => ({ record: { text: `${txt}${i}`, createdAt: '2026-07-05T00:00:00Z' }, likeCount: 0, repostCount: 0 }));
  const calls = [];
  const fakeHttp = async (url) => {
    calls.push(url);
    return calls.length === 1
      ? { ok: true, json: async () => ({ posts: mk(100, '#ai'), cursor: 'c1' }) }
      : { ok: true, json: async () => ({ posts: mk(5, '#ai'), cursor: null }) };
  };
  const fetcher = createBlueskyFetcher({ pageSize: 100, limit: 3000, fetch: fakeHttp });
  const posts = await fetcher('#ai');
  assert.equal(posts.length, 105);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /cursor=c1/);
});

test('createBlueskyFetcher: HTTP 실패 → 빈 배열(안전)', async () => {
  const fakeHttp = async () => ({ ok: false, json: async () => ({}) });
  const fetcher = createBlueskyFetcher({ fetch: fakeHttp });
  assert.deepEqual(await fetcher('#ai'), []);
});
