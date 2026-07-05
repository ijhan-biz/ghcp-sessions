import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSnapshotFetcher } from '../src/fetchers/snapshot.js';
import { searchPosts, rankTrends } from '../src/trends.js';

// 파일/네트워크 없이 주입된 posts로 스냅샷 fetcher를 결정론 검증한다.
const posts = [
  { text: '#뉴스 오늘 소식', likes: 3, reposts: 1, createdAt: '2026-07-05T00:00:00Z', language: 'ko' },
  { text: '#날씨 비 예보', likes: 5, reposts: 0, createdAt: '2026-07-05T00:00:00Z', language: 'ko' },
  { text: '#ai english post', likes: 1, reposts: 0, createdAt: '2026-07-05T00:00:00Z', language: 'en' },
];

test('snapshot: 빈 검색어 → 전체 반환', async () => {
  const f = createSnapshotFetcher({ posts });
  assert.equal((await f('')).length, 3);
});

test('snapshot: 키워드 부분일치(#뉴스 → 뉴스 매칭)', async () => {
  const f = createSnapshotFetcher({ posts });
  const r = await f('#뉴스');
  assert.equal(r.length, 1);
  assert.ok(r[0].text.includes('뉴스'));
});

test('snapshot: 대소문자 무시', async () => {
  const f = createSnapshotFetcher({ posts });
  assert.equal((await f('AI')).length, 1);
});

test('snapshot: searchPosts·rankTrends와 결합', async () => {
  const f = createSnapshotFetcher({ posts });
  const collected = await searchPosts('#날씨', { fetch: f });
  assert.equal(rankTrends(collected, { topN: 5 })[0].tag, '날씨');
});

test('snapshot: posts 없으면 빈 배열', async () => {
  const f = createSnapshotFetcher({ posts: [] });
  assert.deepEqual(await f(''), []);
});
