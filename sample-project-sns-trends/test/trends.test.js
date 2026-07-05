import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractHashtags, engagement, rankTrends, searchPosts } from '../src/trends.js';

// Day2-S4: 아래 { skip: true } 두 곳을 제거하고 src/trends.js 의 recencyWeight 를 구현하세요(test-first).

const NOW = Date.parse('2026-07-05T00:00:00Z');
const day = (n) => new Date(NOW - n * 86_400_000).toISOString();

const posts = [
  { text: '신제품 발표 #AI 최고 #tech', likes: 10, reposts: 2, createdAt: day(0) },
  { text: '#ai 어렵다', likes: 1, reposts: 0, createdAt: day(0) },
  { text: '옛날 글 #tech 좋았지', likes: 100, reposts: 50, createdAt: day(30) },
  { text: '태그 없는 글', likes: 5, reposts: 0, createdAt: day(0) },
];

test('extractHashtags: 소문자·# 제거·한글 지원', () => {
  assert.deepEqual(extractHashtags('가 #AI 나 #Tech_1 다 #한글'), ['ai', 'tech_1', '한글']);
});

test('engagement: likes + reposts*2', () => {
  assert.equal(engagement({ likes: 3, reposts: 4 }), 11);
  assert.equal(engagement({}), 0);
});

test('정상: 언급된 태그들이 랭킹에 포함', () => {
  const tags = rankTrends(posts, { now: NOW, topN: 10 }).map((x) => x.tag);
  assert.ok(tags.includes('ai'));
  assert.ok(tags.includes('tech'));
});

test('경계: topN<=0 → 빈 배열', () => {
  assert.deepEqual(rankTrends(posts, { now: NOW, topN: 0 }), []);
});

test('경계: 빈 게시물 → 빈 배열', () => {
  assert.deepEqual(rankTrends([], { now: NOW }), []);
});

test('예외: posts가 배열이 아니면 → 빈 배열(방어)', () => {
  assert.deepEqual(rankTrends(null, { now: NOW }), []);
});

test('searchPosts: fetch 미주입 → 빈 배열', async () => {
  assert.deepEqual(await searchPosts('q', {}), []);
});

test('searchPosts: fake fetch 결과를 그대로 반환', async () => {
  const fake = async () => [{ text: '#x', likes: 1, reposts: 0 }];
  assert.equal((await searchPosts('q', { fetch: fake })).length, 1);
});

test('searchPosts: fetch 실패(throw) → 빈 배열(안전 처리)', async () => {
  const boom = async () => { throw new Error('network'); };
  assert.deepEqual(await searchPosts('q', { fetch: boom }), []);
});

// --- Day2-S4 test-first (recencyWeight 구현 전이라 skip) ---
test('최근성: 동일 조건이면 최근 게시물의 태그가 상위', { skip: true }, () => {
  const p = [
    { text: '#old', likes: 0, reposts: 0, createdAt: day(60) }, // 먼저(오래됨)
    { text: '#new', likes: 0, reposts: 0, createdAt: day(0) },  // 나중(최근)
  ];
  const r = rankTrends(p, { now: NOW, topN: 10 });
  assert.equal(r[0].tag, 'new'); // 감쇠 구현 시 최근 #new 가 위. (stub 은 동점→입력순 #old)
});

test('최근성: 7일 지난 게시물 태그 점수는 감쇠(1 미만)', { skip: true }, () => {
  const p = [{ text: '#x', likes: 0, reposts: 0, createdAt: day(7) }]; // 반감기 1회
  const r = rankTrends(p, { now: NOW, topN: 10 });
  assert.ok(r[0].score < 1); // 반감기 7일 → (1+0)*0.5 = 0.5 < 1 (stub 은 1)
});
