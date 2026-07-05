import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTTLCache } from '../src/cache.js';

test('cache: miss → set → hit', () => {
  const c = createTTLCache({ ttlMs: 1000 });
  assert.equal(c.get('a'), undefined);   // miss
  c.set('a', { v: 1 });
  assert.deepEqual(c.get('a'), { v: 1 }); // hit
});

test('cache: TTL 만료 후 miss(재수집 유도)', () => {
  let clock = 1000;
  const c = createTTLCache({ ttlMs: 500, now: () => clock });
  c.set('a', 42);
  clock = 1400;                 // 400ms 경과 → 유효
  assert.equal(c.get('a'), 42);
  clock = 1600;                 // 600ms 경과 → 만료
  assert.equal(c.get('a'), undefined);
});

test('cache: 서로 다른 키는 격리', () => {
  const c = createTTLCache({ ttlMs: 1000 });
  c.set('a', 1);
  c.set('b', 2);
  assert.equal(c.get('a'), 1);
  assert.equal(c.get('b'), 2);
});

test('cache: 같은 키 재set은 시각 갱신', () => {
  let clock = 0;
  const c = createTTLCache({ ttlMs: 100, now: () => clock });
  c.set('a', 'x');
  clock = 80;
  c.set('a', 'y');              // 시각 갱신
  clock = 150;                  // 첫 set 기준이면 만료지만 재set 기준 70ms → 유효
  assert.equal(c.get('a'), 'y');
});
