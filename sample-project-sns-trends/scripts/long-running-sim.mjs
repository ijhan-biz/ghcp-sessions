#!/usr/bin/env node
// scripts/long-running-sim.mjs
// Day2-S3: 장기 실행 안전장치를 "실행"으로 체험한다(실제 LLM 호출 없음).
// 보여주는 것: Loop(Collect→…→Reflect) · cost_burn 게이트 · 체크포인트 · max retry · 캐너리 롤백.
// 사용: node scripts/long-running-sim.mjs [seed]   (seed 를 바꾸면 다른 시나리오)

const SLO = { costBurnTicket: 2.0, costBurnPage: 4.0, checkpointSuccessMin: 0.99, maxRetry: 3 };

// 결정적 난수(seed 고정 → 재현 가능)
function makeRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const seed = Number(process.argv[2]) || 7;
const rnd = makeRng(seed);
const stages = ['Collect', 'Normalize', 'Generate', 'Validate', 'Approve', 'Reflect'];
const canary = [0.05, 0.25, 1.0];

let costBurn = 1.0, retries = 0, ckptOk = 0, ckptTotal = 0;
console.log(`=== Long-Running Loop 시뮬레이션 (seed=${seed}) ===`);

for (const stage of stages) {
  costBurn = +(costBurn * (0.85 + rnd() * 0.5)).toFixed(2);
  ckptTotal++;
  const restored = rnd() > 0.03;
  if (restored) ckptOk++;

  let line = `[${stage.padEnd(9)}] cost_burn=${costBurn}x  checkpoint=${restored ? 'ok' : 'FAIL'}`;
  if (costBurn >= SLO.costBurnPage) { line += '  → PAGE + auto-downshift'; costBurn = 1.0; }
  else if (costBurn >= SLO.costBurnTicket) { line += '  → ticket'; }

  if (!restored) {
    retries++;
    line += `  (retry ${retries}/${SLO.maxRetry})`;
    if (retries >= SLO.maxRetry) {
      console.log(line);
      console.log('✗ STOP: max retry 초과 → 사람 리뷰로 전환 (HE-08)');
      process.exit(1);
    }
  }
  console.log(line);
}

console.log('--- Canary 롤아웃 (지표 악화 시 즉시 0% 롤백) ---');
for (const pct of canary) {
  const degraded = rnd() < 0.08;
  console.log(`  ${String(Math.round(pct * 100)).padStart(3)}% 배포 → ${degraded ? '지표 악화 → 즉시 0% 롤백' : 'ok'}`);
  if (degraded) { console.log('✗ STOP: 캐너리 롤백'); process.exit(1); }
}

const rate = ckptOk / ckptTotal;
const pass = rate >= SLO.checkpointSuccessMin;
console.log('--- 게이트 판정 ---');
console.log(`checkpoint_restore_success_rate=${(rate * 100).toFixed(1)}% (기준 ≥99%) → ${pass ? 'PASS ✓' : 'BLOCK ✗'}`);
console.log('원칙: 비용 소모가 보이지 않으면 확장하지 않는다. soft gate=신호, hard gate=go/no-go.');
process.exit(pass ? 0 : 1);
