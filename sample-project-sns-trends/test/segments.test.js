import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankTrendsBySegment, filterRecentDays, filterLanguages, detectLang } from '../src/trends.js';

const NOW = Date.parse('2026-07-05T00:00:00Z');
const day = (n) => new Date(NOW - n * 86_400_000).toISOString();

const posts = [
  { text: '#ai #tech', likes: 5, reposts: 0, createdAt: day(0), region: '서울', ageGroup: '20대' },
  { text: '#ai', likes: 1, reposts: 0, createdAt: day(0), region: '서울', ageGroup: '10대' },
  { text: '#kpop', likes: 9, reposts: 3, createdAt: day(0), region: '부산', ageGroup: '10대' },
  { text: '#tech', likes: 2, reposts: 0, createdAt: day(0), region: '부산', ageGroup: '30대' },
  { text: '#daily', likes: 1, reposts: 0, createdAt: day(0) }, // region/ageGroup 없음 → 제외
];

test('rankTrendsBySegment: region별로 상위 트렌드 그룹핑', () => {
  const byRegion = rankTrendsBySegment(posts, 'region', { now: NOW, topN: 3 });
  assert.deepEqual(Object.keys(byRegion).sort(), ['부산', '서울']);
  assert.ok(byRegion['서울'].some((t) => t.tag === 'ai'));
  assert.equal(byRegion['부산'][0].tag, 'kpop'); // 부산 최고 인게이지먼트
});

test('rankTrendsBySegment: ageGroup별 그룹핑', () => {
  const byAge = rankTrendsBySegment(posts, 'ageGroup', { now: NOW, topN: 3 });
  assert.deepEqual(Object.keys(byAge).sort(), ['10대', '20대', '30대']);
  assert.equal(byAge['10대'][0].tag, 'kpop');
});

test('rankTrendsBySegment: 세그먼트 값 없는 게시물은 제외', () => {
  const byRegion = rankTrendsBySegment(posts, 'region', { now: NOW });
  const totalTaggedRegions = Object.keys(byRegion).length;
  assert.equal(totalTaggedRegions, 2); // #daily(지역없음)은 어떤 지역에도 없음
});

test('rankTrendsBySegment: 잘못된 dimension → 빈 객체', () => {
  assert.deepEqual(rankTrendsBySegment(posts, 'gender', { now: NOW }), {});
});

test('rankTrendsBySegment: posts가 배열 아니면 → 빈 객체(방어)', () => {
  assert.deepEqual(rankTrendsBySegment(null, 'region'), {});
});

test('filterRecentDays: 최근 7일(이번 주) 이내만 남긴다', () => {
  const p = [
    { text: '#a', createdAt: day(0) },
    { text: '#b', createdAt: day(6) },
    { text: '#c', createdAt: day(8) },   // 이번 주 밖
    { text: '#d', createdAt: day(30) },  // 이번 주 밖
  ];
  const r = filterRecentDays(p, 7, NOW);
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((x) => x.text), ['#a', '#b']);
});

test('filterRecentDays: createdAt 없으면 유지, 비배열/0일 방어', () => {
  assert.equal(filterRecentDays([{ text: '#x' }], 7, NOW).length, 1);
  assert.deepEqual(filterRecentDays(null, 7), []);
  assert.equal(filterRecentDays([{ text: '#x', createdAt: day(99) }], 0, NOW).length, 1); // days<=0 → 전체 유지
});

test('filterRecentDays: 최근 6개월(180일) 창', () => {
  const p = [
    { text: '#a', createdAt: day(10) },   // 유지
    { text: '#b', createdAt: day(150) },  // 유지(약 5개월)
    { text: '#c', createdAt: day(210) },  // 6개월 밖 → 제외
  ];
  const r = filterRecentDays(p, 180, NOW);
  assert.deepEqual(r.map((x) => x.text), ['#a', '#b']);
});

test('detectLang: 한글→ko, 라틴→en, 그 외 null', () => {
  assert.equal(detectLang('#ai 최신 소식'), 'ko');
  assert.equal(detectLang('#ai latest news'), 'en');
  assert.equal(detectLang('12345 #_'), null);
});

test('filterLanguages: language 필드로 ko/en만 남기고 de 제외', () => {
  const p = [
    { text: '#ai 소식', language: 'ko' },
    { text: '#ai news', language: 'en' },
    { text: '#ai Nachrichten', language: 'de' }, // 독일어 → 제외
  ];
  const r = filterLanguages(p, ['ko', 'en']);
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((x) => x.language), ['ko', 'en']);
});

test('filterLanguages: language 없으면 텍스트로 추론', () => {
  const p = [
    { text: '#ai 한국어 글' },   // ko 추론 → 유지
    { text: '#ai english post' }, // en 추론 → 유지
  ];
  const r = filterLanguages(p, ['ko', 'en']);
  assert.equal(r.length, 2);
});

test('filterLanguages: langs 비면 전체 유지, 비배열 방어', () => {
  assert.equal(filterLanguages([{ text: 'x', language: 'de' }], []).length, 1);
  assert.deepEqual(filterLanguages(null, ['ko']), []);
});
