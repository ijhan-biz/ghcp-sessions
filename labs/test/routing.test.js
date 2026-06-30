// test/routing.test.js
// Day2-S6: 단계별 모델 라우팅 규칙(routeModel)을 검증한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeModel } from '../scripts/model-routing-demo.mjs';

test('계획 단계는 고추론 모델', () => {
  assert.equal(routeModel('plan').tier, 'high-reasoning');
});
test('구현 단계는 빠른/auto 모델', () => {
  assert.equal(routeModel('generate').tier, 'fast/auto');
});
test('게이트 단계는 결정론적 검사 우선', () => {
  assert.equal(routeModel('gate').tier, 'checker-first');
});
test('알 수 없는 단계는 기본값 auto', () => {
  assert.equal(routeModel('unknown-stage').tier, 'auto');
});
