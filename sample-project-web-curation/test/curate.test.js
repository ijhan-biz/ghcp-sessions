// test/curate.test.js
// Day1-S2: AC ↔ 테스트 이름 매핑을 읽어 보세요.
// Day2-S4: 아래 { skip: true } 두 곳을 제거하고 src/curate.js 의 normalizeUrl 을 구현하세요(test-first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeByUrl, rankResults, summarizeTop } from '../src/curate.js';

const sample = [
  { title: 'A intro', url: 'http://ex.com/a', score: 3 },
  { title: 'B guide', url: 'http://ex.com/b', score: 5 },
  { title: 'C', url: 'http://ex.com/a', score: 1 }, // A와 완전히 같은 URL
];

// --- 랭킹/요약(정상·경계): baseline green ---
test('점수 내림차순 정렬', () => {
  const r = rankResults(sample, 'guide');
  assert.equal(r[0].title, 'B guide'); // score 5 최상위
});
test('상위 N개를 {title,url}로 요약', () => {
  const r = summarizeTop(rankResults(sample, ''), 2);
  assert.equal(r.length, 2);
  assert.deepEqual(Object.keys(r[0]).sort(), ['title', 'url']);
});
test('N<=0 이면 빈 배열, N>len 이면 전체', () => {
  assert.deepEqual(summarizeTop(sample, 0), []);
  assert.equal(summarizeTop(sample, 99).length, sample.length);
});
test('완전히 같은 URL 중복 제거', () => {
  assert.equal(dedupeByUrl(sample).length, 2); // A, C 동일 URL → 1개로
});

// --- Day2-S4 SDD test-first (normalizeUrl 구현 전이라 skip) ---
test('끝 슬래시 변형 URL도 중복 제거', { skip: true }, () => {
  const items = [{ title: 'x', url: 'http://ex.com/p' }, { title: 'x2', url: 'http://ex.com/p/' }];
  assert.equal(dedupeByUrl(items).length, 1);
});
test('utm 트래킹 파라미터 변형 URL도 중복 제거', { skip: true }, () => {
  const items = [{ title: 'x', url: 'http://ex.com/p' }, { title: 'x2', url: 'http://ex.com/p?utm_source=news' }];
  assert.equal(dedupeByUrl(items).length, 1);
});
