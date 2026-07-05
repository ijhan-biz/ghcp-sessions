import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localInsight, generateInsight } from '../src/insight.js';

const trends = [
  { tag: 'ai', score: 35.58, count: 3 },
  { tag: 'tech', score: 28.58, count: 2 },
  { tag: 'study', score: 7.0, count: 1 },
];
const posts = [{ text: '#ai #tech' }, { text: '#ai' }, { text: '#study' }];

test('localInsight: 결정론적 요약(상위 태그·언급·건수 포함)', () => {
  const r = localInsight('#ai', trends, posts);
  assert.equal(r.source, 'local');
  assert.match(r.summary, /#ai|"#ai"/);
  assert.ok(r.bullets.length >= 2);
  assert.ok(r.bullets.some((b) => b.includes('#ai')));
  assert.ok(r.bullets.some((b) => b.includes('3건') || b.includes('총')));
});

test('localInsight: 수집 0건 → 안내 문구, 빈 불릿', () => {
  const r = localInsight('#none', [], []);
  assert.deepEqual(r.bullets, []);
  assert.match(r.summary, /수집 결과가 없/);
});

test('generateInsight: 토큰 없으면 로컬 요약으로 폴백', async () => {
  const r = await generateInsight('#ai', trends, posts, {});
  assert.equal(r.source, 'local');
});

test('localInsight: 세그먼트(지역·연령) 하이라이트 포함', () => {
  const segments = {
    byRegion: { 서울: [{ tag: 'ai', score: 10, count: 2 }], 부산: [{ tag: 'kpop', score: 8, count: 1 }] },
    byAge: { '10대': [{ tag: 'kpop', score: 8, count: 1 }] },
  };
  const r = localInsight('#ai', trends, posts, segments);
  assert.ok(r.bullets.some((b) => b.includes('지역별') && b.includes('서울 #ai')));
  assert.ok(r.bullets.some((b) => b.includes('연령대별') && b.includes('10대 #kpop')));
});

test('generateInsight: 토큰+주입 fetch면 LLM 결과 사용', async () => {
  const fakeHttp = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '- 인사이트 하나\n- 인사이트 둘' } }] }),
  });
  const r = await generateInsight('#ai', trends, posts, {
    fetch: fakeHttp, token: 'tkn', endpoint: 'https://models.test/chat', model: 'gpt-4o-mini',
  });
  assert.equal(r.source, 'llm');
  assert.deepEqual(r.bullets, ['인사이트 하나', '인사이트 둘']);
});

test('generateInsight: LLM 실패(throw)해도 로컬로 안전 폴백', async () => {
  const boom = async () => { throw new Error('network'); };
  const r = await generateInsight('#ai', trends, posts, {
    fetch: boom, token: 'tkn', endpoint: 'https://models.test/chat',
  });
  assert.equal(r.source, 'local');
});
