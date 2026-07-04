#!/usr/bin/env node
// scripts/token-estimate.mjs
// 입력(프롬프트·첨부 파일)의 토큰 "근사치"를 오프라인·의존성 0으로 추정한다.
//
// 왜 필요한가: GitHub Copilot Chat은 요청당 정확한 토큰 수를 보여주는 계량기를 UI로
//   제공하지 않고, 과금도 토큰이 아니라 premium request 단위다(032 UBB). 그래서 이 실습의
//   목표는 "정확 과금"이 아니라 범위 축소가 입력 토큰을 얼마나 줄이는지 "감각"으로 보는 것.
//   Before/After에서 실제로 커지는 건 프롬프트 문장이 아니라 "첨부한 파일 내용"이므로,
//   첨부 대상 파일들의 근사 토큰 합을 비교하면 절감이 눈에 보인다.
//
// 사용:
//   node scripts/token-estimate.mjs <파일...>        # 파일 단위(여러 개면 합계)
//   printf '%s' "프롬프트" | node scripts/token-estimate.mjs   # 표준입력(프롬프트 단위)
//   예) Before: node scripts/token-estimate.mjs src/**/*.js
//       After : node scripts/token-estimate.mjs src/billing/tax.js
//
// 주의: 근사치다(±20~40%). 모델별 실제 BPE 토크나이저와 다르며, 정확 과금이 아니다.
//   절대값보다 Before/After "비율"을 보라.
import { readFileSync, existsSync, statSync } from 'node:fs';

// 근사 규칙(문서화): ASCII는 ~4자/토큰, 비ASCII(한글/CJK 등)는 대략 1자≈1.3토큰(더 비쌈).
function estimate(text) {
  let ascii = 0, nonAscii = 0;
  for (const ch of text) (ch.codePointAt(0) < 128 ? ascii++ : nonAscii++);
  const tokens = Math.round(ascii / 4 + nonAscii * 1.3);
  return { chars: ascii + nonAscii, ascii, nonAscii, tokens };
}

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

const args = process.argv.slice(2);
const rows = [];
let total = 0;

if (args.length === 0) {
  const text = readStdin();
  if (!text) {
    console.error('✗ 입력이 없습니다. 파일 경로를 주거나 표준입력으로 프롬프트를 넘기세요.');
    console.error("  예: printf '%s' \"프롬프트\" | node scripts/token-estimate.mjs");
    process.exit(2);
  }
  const e = estimate(text);
  rows.push(['(stdin)', e]);
  total = e.tokens;
} else {
  for (const f of args) {
    if (!existsSync(f) || !statSync(f).isFile()) {
      console.error(`  (건너뜀: 파일 아님) ${f}`);
      continue;
    }
    const e = estimate(readFileSync(f, 'utf8'));
    rows.push([f, e]);
    total += e.tokens;
  }
  if (rows.length === 0) { console.error('✗ 읽을 파일이 없습니다.'); process.exit(2); }
}

console.log('토큰 근사치(±20~40%, 정확 과금 아님):\n');
for (const [name, e] of rows) {
  console.log(`  ~${String(e.tokens).padStart(6)} tokens  ·  ${String(e.chars).padStart(6)} chars  ·  ${name}`);
}
if (rows.length > 1) console.log(`  ${'─'.repeat(28)}\n  ~${String(total).padStart(6)} tokens  ·  합계(${rows.length}개 파일)`);
console.log('\n힌트: Before(전체 첨부)와 After(범위 한정)를 각각 돌려 합계를 비교하세요. 비율이 핵심입니다.');
