import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapStatusesToPosts, stripHtml, createMastodonFetcher } from '../src/fetchers/mastodon.js';
import { searchPosts, rankTrends } from '../src/trends.js';

// 실제 네트워크 없이 주입된 fake fetch로 Mastodon 어댑터를 결정론 검증한다.

test('stripHtml: 태그 제거·엔티티 해제·해시태그 텍스트 보존', () => {
  const html = '<p>신제품 <a href="x">#ai</a> &amp; <a>#tech</a> 발표</p>';
  assert.equal(stripHtml(html), '신제품 #ai & #tech 발표');
});

test('mapStatusesToPosts: status → post 매핑(favourites/reblogs/created_at)', () => {
  const data = [
    { content: '<p>#ai 소식</p>', favourites_count: 10, reblogs_count: 3, created_at: '2026-07-05T00:00:00Z' },
    { content: '<p>내용 없음태그</p>', favourites_count: 0, reblogs_count: 0, created_at: '2026-07-04T00:00:00Z' },
  ];
  const posts = mapStatusesToPosts(data);
  assert.equal(posts.length, 2);
  assert.equal(posts[0].text, '#ai 소식');
  assert.equal(posts[0].likes, 10);
  assert.equal(posts[0].reposts, 3);
  assert.equal(posts[0].createdAt, '2026-07-05T00:00:00Z');
});

test('mapStatusesToPosts: 배열 아니면 → 빈 배열(방어)', () => {
  assert.deepEqual(mapStatusesToPosts(null), []);
  assert.deepEqual(mapStatusesToPosts({}), []);
});

test('createMastodonFetcher: 태그 타임라인 호출 URL 구성 + 매핑', async () => {
  let calledUrl = '';
  const fakeHttp = async (url) => {
    calledUrl = url;
    return { ok: true, json: async () => ([{ content: '<p>#ai 실데이터</p>', favourites_count: 5, reblogs_count: 1, created_at: '2026-07-05T00:00:00Z' }]) };
  };
  const fetcher = createMastodonFetcher({ instance: 'https://mastodon.social', fetch: fakeHttp });
  const posts = await fetcher('#ai');
  assert.match(calledUrl, /\/api\/v1\/timelines\/tag\/ai\?limit=40$/);
  assert.equal(posts.length, 1);
  const trends = rankTrends(posts, { topN: 5 });
  assert.equal(trends[0].tag, 'ai');
});

test('createMastodonFetcher: 쿼리 없으면 트렌딩(trends/statuses) 호출', async () => {
  let calledUrl = '';
  const fakeHttp = async (url) => { calledUrl = url; return { ok: true, json: async () => [] }; };
  const fetcher = createMastodonFetcher({ instance: 'https://mastodon.social/', fetch: fakeHttp });
  await fetcher('');
  assert.match(calledUrl, /\/api\/v1\/trends\/statuses\?limit=40$/);
});

test('createMastodonFetcher: 트렌딩은 offset 페이지네이션', async () => {
  const mkPage = (n) => Array.from({ length: n }, (_, i) => ({
    id: String(i), content: `<p>#ai 트렌딩${i}</p>`,
    favourites_count: 0, reblogs_count: 0, created_at: '2026-07-05T00:00:00Z',
  }));
  const calls = [];
  const fakeHttp = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => (calls.length === 1 ? mkPage(40) : mkPage(3)) };
  };
  const fetcher = createMastodonFetcher({ pageSize: 40, limit: 200, fetch: fakeHttp });
  const posts = await fetcher('');
  assert.equal(posts.length, 43);              // 40 + 3
  assert.equal(calls.length, 2);
  assert.match(calls[1], /offset=40/);         // 2페이지는 offset=40
});

test('createMastodonFetcher: HTTP 실패 → 빈 배열(안전), searchPosts와 결합해도 안전', async () => {
  const fakeHttp = async () => ({ ok: false, json: async () => ({}) });
  const fetcher = createMastodonFetcher({ fetch: fakeHttp });
  assert.deepEqual(await searchPosts('#ai', { fetch: fetcher }), []);
});

test('createMastodonFetcher: 페이지네이션으로 여러 페이지 수집(max_id 커서)', async () => {
  const mkPage = (n, base) => Array.from({ length: n }, (_, i) => ({
    id: String(base + i),
    content: `<p>#ai 글${base + i}</p>`,
    favourites_count: 1, reblogs_count: 0, created_at: '2026-07-05T00:00:00Z',
  }));
  const calls = [];
  const fakeHttp = async (url) => {
    calls.push(url);
    // 1페이지: 40건(가득) → 다음 페이지 요청, 2페이지: 5건(부족) → 종료
    const data = calls.length === 1 ? mkPage(40, 0) : mkPage(5, 100);
    return { ok: true, json: async () => data };
  };
  const fetcher = createMastodonFetcher({ instance: 'https://mastodon.social', pageSize: 40, limit: 120, fetch: fakeHttp });
  const posts = await fetcher('#ai');
  assert.equal(posts.length, 45);       // 40 + 5
  assert.equal(calls.length, 2);        // 두 페이지 요청
  assert.match(calls[1], /max_id=39/);  // 1페이지 마지막 id로 커서 이동
});

test('createMastodonFetcher: sinceDays 창을 벗어나면 조기 중단', async () => {
  const now = Date.now();
  const iso = (daysAgo) => new Date(now - daysAgo * 86_400_000).toISOString();
  const mkPage = (base, createdDaysAgo) => Array.from({ length: 40 }, (_, i) => ({
    id: String(base + i),
    content: `<p>#ai 글${base + i}</p>`,
    favourites_count: 0, reblogs_count: 0, created_at: iso(createdDaysAgo),
  }));
  const calls = [];
  const fakeHttp = async (url) => {
    calls.push(url);
    // 1페이지: 최근(1일 전), 2페이지: 이번 주 밖(10일 전) → 2페이지 후 중단
    const data = calls.length === 1 ? mkPage(0, 1) : mkPage(100, 10);
    return { ok: true, json: async () => data };
  };
  const fetcher = createMastodonFetcher({ instance: 'https://mastodon.social', pageSize: 40, limit: 3000, sinceDays: 7, fetch: fakeHttp });
  const posts = await fetcher('#ai');
  assert.equal(calls.length, 2);      // 3페이지 이상 요청하지 않음
  assert.equal(posts.length, 80);     // 2페이지까지 수집(필터는 서버에서)
});
