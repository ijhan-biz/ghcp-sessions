#!/usr/bin/env node
// scripts/make-review-packet.mjs
// Day2-S5: PR 을 대체하는 'local review packet' 을 생성한다.
// 변경 요약 + 테스트 결과 + 정책 체크 + 롤백 노트 + no-cloud attestation 을 review-packet.md 로 모음.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); }
  catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`.trim();
    return out || `('${cmd}' 실행 불가)`;
  }
}

const diffStat = run('git diff --stat HEAD');
const testOut = run('node --test test 2>&1 | tail -n 15');
const policyOut = run('node scripts/policy-check.mjs 2>&1');
const now = new Date().toISOString();

const md = `# Local Review Packet
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

## 4. Rollback Note
- Trigger: AC 회귀 / 테스트 실패 / 금지 파일 변경 감지
- Owner: [담당자/PL 이름]
- Action: \`git restore <files>\` 또는 해당 local commit revert
- Verify: \`npm run gate\`
- Completion: baseline green, 스펙 v1 상태로 복구

## 5. No-cloud Attestation
- Codespaces / GitHub PR / GitHub Actions 미사용.
- 로컬 VS Code + 로컬 Git 에서만 변경·검증함.
`;

writeFileSync('review-packet.md', md);
console.log('✓ review-packet.md 생성 완료 — 리뷰어에게 이 파일을 전달하세요(PR 대체).');
