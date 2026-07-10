#!/usr/bin/env node
// scripts/spec-check.mjs
// Day1 '좋은 입력' 자가검증 게이트 — 스펙(마크다운)이 "검증 가능한 형태"를 갖췄는지 결정론적으로 점검한다.
// 의존성 0. 사용: node scripts/spec-check.mjs [경로]
// 기본: spec.md → FEATURE-SPEC.md(완성 폴백) → templates/feature-spec-card.md
//
// 목적: Day2-S4 test-first 전에, 본인 스펙이 정상/예외/경계 AC와 제외 범위·비식별을 갖췄는지
//       스스로 "통과/보완"을 확인해 '좋은 입력'에도 게이트 경험을 준다.
import { readFileSync, existsSync } from 'node:fs';

const arg = process.argv[2];
const file = [arg, 'spec.md', 'FEATURE-SPEC.md', 'templates/feature-spec-card.md'].find(f => f && existsSync(f));
if (!file) {
  console.error('✗ 점검할 스펙 파일이 없습니다.');
  console.error('  사용: node scripts/spec-check.mjs <스펙.md>   (또는 spec.md 를 만드세요)');
  process.exit(2);
}
const text = readFileSync(file, 'utf8');
const has = (re) => re.test(text);

// [라벨, 정규식, 필수여부]
const checks = [
  ['기능/목표 명시',        /기능명|##\s*context|##\s*목표|feature:/i, true],
  ['Acceptance Criteria',   /acceptance criteria|(^|\s)AC\d|##\s*AC/im,  true],
  ['정상 케이스',           /정상|성공|happy|\bnormal\b/i,               true],
  ['예외 케이스',           /예외|오류|에러|throw|reject|실패|\berror\b/i, true],
  ['경계 케이스',           /경계|boundary|빈 배열|empty|최소|최대|\bnull\b|0원|음수/i, true],
  ['제외 범위(non-goal)',   /non-goal|제외 범위|비목표/i,                false],
  ['검증 수단 명시',        /npm test|검증 방법|측정 source|테스트로 확인/i, false],
  ['민감정보 제거 확인',    /민감정보|비식별|고객명.*없음|de-?identif/i,   false],
];

console.log(`스펙 자가검증: ${file}\n`);
let missingRequired = 0;
for (const [label, re, required] of checks) {
  const ok = has(re);
  const mark = ok ? '[ok]' : (required ? '[X ]' : '[· ]');
  console.log(`  ${mark} ${label}${required ? '' : '  (권장)'}`);
  if (required && !ok) missingRequired++;
}

console.log('');
if (missingRequired === 0) {
  console.log('✓ spec-check 통과 — 정상·예외·경계 AC를 갖춘 검증 가능한 스펙입니다.');
  process.exit(0);
} else {
  console.error(`✗ 보완 필요 — 필수 항목 ${missingRequired}개 누락([X ] 표시). AC를 정상/예외/경계로 나눠 보강하세요.`);
  process.exit(1);
}
