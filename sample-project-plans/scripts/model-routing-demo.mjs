#!/usr/bin/env node
// scripts/model-routing-demo.mjs
// Day2-S6: 단계별 모델 라우팅 데모. 고추론 모델은 "의사결정 병목"에만, 구현은 빠른/auto.
// routeModel 은 순수 함수라 test/routing.test.js 로도 검증된다.

export function routeModel(stage) {
  const table = {
    plan:     { tier: 'high-reasoning', why: '의사결정 병목 — 계획/스펙/AC' },
    generate: { tier: 'fast/auto',      why: '합의된 계획 실행 — 재추론 억제' },
    evaluate: { tier: 'auto/mid',       why: '검토 — 비용 효율' },
    gate:     { tier: 'checker-first',  why: '결정론적 검사 우선(모델보다)' },
  };
  return table[stage] ?? { tier: 'auto', why: '기본값' };
}

// CLI 로 직접 실행할 때만 출력(import 시에는 조용히).
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 단계별 모델 라우팅(권장 기본값) ===');
  for (const stage of ['plan', 'generate', 'evaluate', 'gate']) {
    const r = routeModel(stage);
    console.log(`  ${stage.padEnd(9)} → ${r.tier.padEnd(15)} (${r.why})`);
  }
  console.log('\n주의: 프롬프트에 모델명을 적는 것은 보장이 아니다.');
  console.log('  custom agent 의 model: / model picker / 세션 로그로 실제 호출 모델을 확인하라.');
}
