// test/tax.test.js
// Day1-S2: AC ↔ 테스트 이름 매핑을 읽어 보세요(요구사항이 그대로 검증 조건이 됩니다).
// 선택형 SDD 미니 예제: 아래 { skip: true } 두 곳을 제거하고 src/billing/tax.js 를 구현하세요(test-first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcVat } from '../src/billing/tax.js';

// AC3 (정상): baseline — 처음부터 통과해야 한다.
test('AC3 일반 품목은 VAT 10%', () => {
  assert.equal(calcVat(1000), 100);
  assert.equal(calcVat(15000), 1500);
});

// --- 선택형 SDD test-first (구현 전이라 skip 상태) ---
test('AC1 음수 금액은 오류를 던진다', { skip: true }, () => {
  assert.throws(() => calcVat(-1000), /amount/);
});

test('AC2 면세 품목은 VAT 0', { skip: true }, () => {
  assert.equal(calcVat(1000, { exempt: true }), 0);
});
