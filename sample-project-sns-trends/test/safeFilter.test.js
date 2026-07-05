import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterSafe, DEFAULT_BLOCKLIST } from '../src/safeFilter.js';

test('filterSafe: 차단어 포함 게시물 제외', () => {
  const posts = [
    { text: '#날씨뉴스 오늘 비 소식' },
    { text: '#야동 성인 스팸' },       // 차단
    { text: '#클로드 #인공지능 후기' },
    { text: '무료 #웹하드 #넷파일' },  // 차단
  ];
  const r = filterSafe(posts);
  const texts = r.map((p) => p.text);
  assert.equal(r.length, 2);
  assert.ok(texts.some((t) => t.includes('날씨뉴스')));
  assert.ok(texts.some((t) => t.includes('클로드')));
  assert.ok(!texts.some((t) => t.includes('야동')));
  assert.ok(!texts.some((t) => t.includes('웹하드')));
});

test('filterSafe: 대소문자 무시(영문 차단어)', () => {
  const posts = [{ text: 'Check this PORN link' }, { text: 'normal post #뉴스' }];
  const r = filterSafe(posts);
  assert.equal(r.length, 1);
  assert.ok(r[0].text.includes('뉴스'));
});

test('filterSafe: 비배열 방어, 커스텀 차단어', () => {
  assert.deepEqual(filterSafe(null), []);
  const r = filterSafe([{ text: '광고 스팸' }, { text: '정상' }], ['광고']);
  assert.equal(r.length, 1);
});

test('DEFAULT_BLOCKLIST: 배열이고 비어있지 않음', () => {
  assert.ok(Array.isArray(DEFAULT_BLOCKLIST) && DEFAULT_BLOCKLIST.length > 0);
});
