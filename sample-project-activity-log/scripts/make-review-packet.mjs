#!/usr/bin/env node
// scripts/make-review-packet.mjs
// Day2-S5: PR 을 대체하는 'local review packet' 을 생성한다.
// 변경 요약 + 테스트 결과 + 정책 체크 + 롤백 노트 + no-cloud attestation 을 review-packet.md 로 모음.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); }
  catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`.trim();
    return out || `('${cmd}' 실행 불가)`;
  }
}

function readLabState(root) {
  const file = join(root, '.lab-state.json');
  if (!existsSync(file)) return { fallback: {} };
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch { return { fallback: {} }; }
}

export function buildPacket(options = {}) {
  const root = options.root || process.cwd();
  const state = options.state || readLabState(root);
  const runCommand = options.runCommand || run;
  const now = options.now || new Date().toISOString();
  const diffStat = runCommand('git diff --stat HEAD');
  const testOut = runCommand('node --test test 2>&1 | tail -n 15');
  const policyOut = runCommand('node scripts/policy-check.mjs 2>&1');
  const recoverReason = state.fallback?.['d2-s4-green'];
  const sourceFile = join(root, 'src/activity.js');
  const solvedFile = join(root, 'fixtures/solved/activity.js');
  const referenceMatch = existsSync(sourceFile) && existsSync(solvedFile)
    && readFileSync(sourceFile, 'utf8') === readFileSync(solvedFile, 'utf8');
  const provenance = recoverReason ? 'FALLBACK' : (referenceMatch ? 'REFERENCE-MATCH' : 'CLEAN');
  const debt = recoverReason || referenceMatch ? '[D2-S5 작성]' : 'N/A';
  const reason = recoverReason || (referenceMatch ? 'source matches solved checkpoint without runner recover' : 'N/A');

  return `# Local Review Packet
생성: ${now}

## 1. 변경 요약 (git diff --stat)
\`\`\`
${diffStat || '(변경 없음)'}
\`\`\`

## 2. 테스트 결과 (node --test, 마지막 15줄)
\`\`\`
${testOut}
\`\`\`

## 3. 정책 체크 (policy-check)
\`\`\`
${policyOut}
\`\`\`

## 4. Execution Provenance
- Status: ${provenance}
- Reference/Recover Step: ${recoverReason ? 'd2-s4-green' : 'N/A'}
- Reference/Recover Reason: ${reason}

## 5. Learning Debt
- Owner: ${debt}
- Due: ${debt}
- D+7 Reimplementation: ${debt}

## 6. Rollback Note
- Trigger: AC 회귀 / 테스트 실패 / 금지 파일 변경 감지
- Owner: [D2-S5 작성]
- Action: \`git restore <files>\` 또는 해당 local commit revert
- Verify: \`npm run gate\`
- Completion: baseline green, 스펙 v1 상태로 복구

## 7. No-cloud Attestation
- Codespaces / GitHub PR / GitHub Actions 미사용.
- 로컬 VS Code + 로컬 Git 에서만 변경·검증함.
`;
}

function isMain() {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isMain()) {
  writeFileSync('review-packet.md', buildPacket());
  console.log('✓ review-packet.md 생성 완료 — provenance·부채·rollback owner를 채운 뒤 제출하세요.');
}
