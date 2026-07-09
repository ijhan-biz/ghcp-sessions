// test/routing.test.js
// Day2-S6: 단계별 모델 라우팅은 순수 함수라 테스트로 고정한다(프롬프트의 모델명은 보장이 아님).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeModel } from '../scripts/model-routing-demo.mjs';

test('routeModel: 단계별 티어 매핑', () => {
  assert.equal(routeModel('plan').tier, 'high-reasoning'); // 의사결정 병목만 고추론
  assert.equal(routeModel('generate').tier, 'fast/auto');  // 구현은 재추론 억제
  assert.equal(routeModel('gate').tier, 'checker-first');  // 게이트는 결정론 검사 우선
});

test('routeModel: 알 수 없는 단계는 기본값', () => {
  assert.equal(routeModel('unknown').tier, 'auto');
});
