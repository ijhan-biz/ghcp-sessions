#!/usr/bin/env node
// scripts/model-routing-demo.mjs
// Day2-S6: 단계별 모델 라우팅 데모.
// 2026-07-11 blind-v2 132 primary + 35 external screen + 29 confirmation attempts 결과.

export const COURSE_MODEL_SELECTION = Object.freeze({
  models: Object.freeze({
    connect: 'gpt-5.3-codex',
    specification: 'gpt-5.6-luna',
    plan: 'none',
    generate: 'gpt-5.4-mini',
    evaluate: 'claude-sonnet-5',
    tutor: 'gemini-3-flash-preview',
    gate: 'none',
  }),
  benchmarkRuns: 196,
  retainedAttempts: 267,
  primaryRuns: 132,
  externalScreenRuns: 35,
  confirmationAttempts: 29,
  stableConfirmationRuns: 12,
  failedConfirmationRuns: 17,
  experimentCreditsEstimate: 218.4625,
  perLearnerCreditsEstimate: 84,
  cohort45CreditsEstimate: 3780.04,
  cohortTarget: 5929.2,
  qualifier: '조직 정책 허용 + handoff별 세션 로그의 실제 호출 모델 확인',
});
// routeModel 은 순수 함수라 test/routing.test.js 로도 검증된다.

export function routeModel(stage) {
  const table = {
    connect:       { family: 'F0', tier: 'code-specialist', model: COURSE_MODEL_SELECTION.models.connect, why: '짧은 다음 행동 품질 3/3' },
    specification: { family: 'F1', tier: 'fast-low-cost', model: COURSE_MODEL_SELECTION.models.specification, why: '명세·경계·허용 범위 품질 3/3' },
    plan:          { family: 'F2', tier: 'human-first', model: COURSE_MODEL_SELECTION.models.plan, why: '모델 후보 5개가 3회 품질 gate를 모두 통과하지 못함' },
    generate:      { family: 'F3', tier: 'fast-low-cost', model: COURSE_MODEL_SELECTION.models.generate, why: '코드 실행검사 6/6과 3회 품질 통과' },
    evaluate:      { family: 'F4', tier: 'quality-review', model: COURSE_MODEL_SELECTION.models.evaluate, why: '결함·gate·provenance 검토 3회 품질 통과' },
    tutor:         { family: 'F5', tier: 'fast-guidance', model: COURSE_MODEL_SELECTION.models.tutor, why: '힌트·복구 프로토콜 3회 품질 통과' },
    gate:          { family: 'N0', tier: 'checker-first', model: COURSE_MODEL_SELECTION.models.gate, why: '결정론적 검사와 사람 승인 우선' },
  };
  return table[stage] ?? { tier: 'auto', why: '기본값' };
}

// CLI 로 직접 실행할 때만 출력(import 시에는 조용히).
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 활동별 모델 라우팅(2026-07-11 · blind-v2 196 decision / 267 retained) ===');
  for (const stage of ['connect', 'specification', 'plan', 'generate', 'evaluate', 'tutor', 'gate']) {
    const r = routeModel(stage);
    console.log(`  ${stage.padEnd(9)} → ${(r.model ?? 'deterministic').padEnd(18)} (${r.why})`);
  }
  console.log(`\n45명 추정: ${COURSE_MODEL_SELECTION.cohort45CreditsEstimate}/${COURSE_MODEL_SELECTION.cohortTarget} AI Credits (F2 N0)`);
  console.log(`retained 실험 추정: ${COURSE_MODEL_SELECTION.experimentCreditsEstimate}/300 AI Credits`);
  console.log(`주의: ${COURSE_MODEL_SELECTION.qualifier}`);
}
