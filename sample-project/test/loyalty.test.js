// test/loyalty.test.js
// Day1-S2: AC ↔ 테스트 이름 매핑을 읽어 보세요.
// Day2-S4: 아래 { skip: true } 두 곳을 제거하고 src/loyalty.js 의 usePoints 를 구현하세요(test-first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { earnPoints, usePoints } from '../src/loyalty.js';

// --- 적립(정상/예외): baseline green ---
test('basic 등급은 1% 적립(내림)', () => {
  assert.equal(earnPoints(10000), 100);
  assert.equal(earnPoints(15050), 150); // 150.5 → 내림
});
test('gold 등급은 5% 적립', () => {
  assert.equal(earnPoints(10000, { tier: 'gold' }), 500);
});
test('적립: 음수 금액은 오류', () => {
  assert.throws(() => earnPoints(-100), /amount/);
});

// --- 사용(정상): baseline green ---
test('사용: 잔액에서 정상 차감', () => {
  assert.equal(usePoints(500, 300), 200);
});

// --- Day2-S4 SDD test-first (구현 전이라 skip) ---
test('사용: 음수 포인트는 오류', { skip: true }, () => {
  assert.throws(() => usePoints(500, -1), /points/);
});
test('사용: 잔액 초과는 오류', { skip: true }, () => {
  assert.throws(() => usePoints(500, 501), /insufficient/);
});
