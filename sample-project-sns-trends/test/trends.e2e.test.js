import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchPosts, rankTrends } from '../src/trends.js';

// E2E: 검색(수집) → 해시태그 추출 → 점수·랭킹 전체 파이프라인을 결정론적으로 검증한다.
// 실제 SNS API/키/네트워크 없이 주입된 fake fetcher로만 동작.

const NOW = Date.parse('2026-07-05T00:00:00Z');
const day = (n) => new Date(NOW - n * 86_400_000).toISOString();

const CORPUS = [
  { text: '신제품 #ai 발표 #tech', likes: 10, reposts: 2, createdAt: day(0) },
  { text: '#ai 튜토리얼', likes: 3, reposts: 1, createdAt: day(1) },
  { text: '옛날 #tech 회고', likes: 100, reposts: 50, createdAt: day(30) },
];

// 쿼리 부분일치로 게시물을 돌려주는 fake fetcher.
const fakeFetch = async (q) => CORPUS.filter((p) => q === '' || p.text.includes(q));

test('E2E: 검색 → 랭킹 파이프라인이 상위 트렌드를 반환', async () => {
  const posts = await searchPosts('#ai', { fetch: fakeFetch });
  assert.equal(posts.length, 2); // #ai 포함 게시물만 수집

  const trends = rankTrends(posts, { now: NOW, topN: 5 });
  assert.ok(trends.length > 0);
  assert.equal(trends[0].tag, 'ai'); // 최근성·인게이지먼트 반영해 #ai 최상위
  assert.ok(trends[0].score > 0);
});

test('E2E: fetch 실패해도 파이프라인은 안전하게 빈 트렌드', async () => {
  const boom = async () => { throw new Error('network'); };
  const posts = await searchPosts('무엇이든', { fetch: boom });
  assert.deepEqual(rankTrends(posts, { now: NOW }), []);
});

test('E2E: fetch 미주입이면 수집 0 → 빈 트렌드', async () => {
  const posts = await searchPosts('#ai', {});
  assert.deepEqual(rankTrends(posts, { now: NOW }), []);
});
