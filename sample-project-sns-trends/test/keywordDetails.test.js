import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explainKeyword, explainTrends } from '../src/keywordDetails.js';
import { rankTrends } from '../src/trends.js';

const NOW = Date.parse('2026-07-05T00:00:00Z');
const day = (n) => new Date(NOW - n * 86_400_000).toISOString();

const posts = [
  { text: '신제품 #ai 발표 #tech', likes: 10, reposts: 2, createdAt: day(0) },
  { text: '#ai 튜토리얼 #study', likes: 3, reposts: 1, createdAt: day(1) },
  { text: '#ai 스타트업 #tech', likes: 20, reposts: 8, createdAt: day(0) },
  { text: '#daily 잡담', likes: 1, reposts: 0, createdAt: day(0) },
];

test('explainKeyword: 등장 건수·연관 태그·요약 생성', () => {
  const d = explainKeyword(posts, 'ai', { now: NOW, maxSamples: 2 });
  assert.equal(d.tag, 'ai');
  assert.equal(d.count, 3);
  // 연관 태그: tech(2회) > study(1회)
  assert.equal(d.related[0].tag, 'tech');
  assert.equal(d.related[0].count, 2);
  assert.match(d.summary, /#ai는 3건에서 등장/);
  assert.match(d.summary, /#tech/);
});

test('explainKeyword: 상세 설명(규모·관심도·최신성·연관·대표) 라인 생성', () => {
  const d = explainKeyword(posts, 'ai', { now: NOW, maxSamples: 2 });
  // 규모: 전체 4건 중 3건(75%)
  assert.equal(d.share, 75);
  assert.ok(d.explanation.some((l) => l.includes('규모') && l.includes('75%')));
  assert.ok(d.explanation.some((l) => l.includes('관심도')));
  assert.ok(d.explanation.some((l) => l.includes('최신성')));
  assert.ok(d.explanation.some((l) => l.includes('연관 키워드') && l.includes('#tech')));
  assert.ok(d.explanation.some((l) => l.includes('대표 게시물') && l.includes('engagement')));
  // 통계: engagement = likes + reposts*2 → 14, 5, 36 → 합 55, 최고 36
  assert.equal(d.stats.totalEngagement, 55);
  assert.equal(d.stats.maxEngagement, 36);
});

test('explainKeyword: 핵심 내용어(해시태그 제외 본문어) 추출', () => {
  const d = explainKeyword(posts, 'ai', { now: NOW });
  assert.ok(d.keywords.length > 0);
  const words = d.keywords.map((k) => k.word);
  assert.ok(words.includes('스타트업'));
  assert.ok(words.includes('신제품'));
  // 해시태그 자기 자신/다른 태그는 내용어에서 제외
  assert.ok(!words.includes('ai'));
  assert.ok(!words.includes('tech'));
  assert.ok(d.explanation.some((l) => l.includes('핵심 내용어')));
});

test('explainKeyword: 태그 의미/맥락 설명(context) 생성', () => {
  const d = explainKeyword(posts, 'ai', { now: NOW });
  assert.equal(typeof d.context, 'string');
  assert.ok(d.context.includes('#ai'));
  assert.ok(d.context.includes('#tech'));      // 연관 태그 반영
  assert.ok(d.context.includes('맥락'));
  assert.ok(d.explanation[0].startsWith('맥락:')); // 첫 줄이 맥락
});

test('explainKeyword: 지역·연령 분포(주 언급층) 설명', () => {
  const segmented = [
    { text: '#ai 소식', likes: 1, reposts: 0, createdAt: day(0), region: '서울', ageGroup: '20대' },
    { text: '#ai 뉴스', likes: 2, reposts: 0, createdAt: day(0), region: '서울', ageGroup: '30대' },
    { text: '#ai 채용', likes: 3, reposts: 0, createdAt: day(0), region: '부산', ageGroup: '20대' },
  ];
  const d = explainKeyword(segmented, 'ai', { now: NOW });
  assert.equal(d.segments.byRegion[0].key, '서울'); // 서울 2건
  assert.equal(d.segments.byRegion[0].count, 2);
  assert.ok(d.explanation.some((l) => l.includes('주 언급층') && l.includes('서울')));
});

test('explainKeyword: 대표 게시물은 engagement×recency 상위 우선', () => {
  const d = explainKeyword(posts, 'ai', { now: NOW, maxSamples: 1 });
  // #ai 스타트업(engagement 36, 최근) 이 가장 상위
  assert.match(d.samples[0], /스타트업/);
});

test('explainKeyword: 대소문자 무시(#AI 도 매칭)', () => {
  const d = explainKeyword([{ text: '#AI 소식', likes: 0, reposts: 0, createdAt: day(0) }], 'ai', { now: NOW });
  assert.equal(d.count, 1);
});

test('explainKeyword: 없는 태그 → count 0, 안내 요약', () => {
  const d = explainKeyword(posts, 'none', { now: NOW });
  assert.equal(d.count, 0);
  assert.deepEqual(d.samples, []);
  assert.match(d.summary, /관련 게시물이 없/);
});

test('explainKeyword: posts가 배열 아니어도 방어', () => {
  const d = explainKeyword(null, 'ai');
  assert.equal(d.count, 0);
});

test('explainTrends: 트렌드 태그마다 설명 맵 생성', () => {
  const trends = rankTrends(posts, { now: NOW, topN: 5 });
  const map = explainTrends(posts, trends, { now: NOW });
  for (const t of trends) {
    assert.ok(map[t.tag], `${t.tag} 설명 존재`);
    assert.equal(typeof map[t.tag].summary, 'string');
  }
});
