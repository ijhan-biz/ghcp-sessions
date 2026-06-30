#!/usr/bin/env node
// scripts/policy-check.mjs
// Day2-S2: 로컬 정책 체크(결정론적 게이트). PR/Actions 없이 로컬에서 금지 변경을 막는다.
// 감지: 금지 경로(.env, secrets/, prod/) 변경 · secret 유사 패턴 · 외부 의존성 추가.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

function sh(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }); } catch { return ''; }
}

// 1) 변경 파일 목록(git 없으면 빈 목록 → 교육 환경 대비)
const changed = sh('git diff --name-only HEAD')
  .split('\n').map(s => s.trim()).filter(Boolean);

const blockedPaths = [/^\.env$/, /^\.env\./, /(^|\/)secrets?\//, /(^|\/)prod\//];
const secretLike = [/AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /ghp_[A-Za-z0-9]{20,}/];

const violations = [];

for (const f of changed) {
  if (blockedPaths.some(p => p.test(f))) violations.push(`금지 경로 변경: ${f}`);
}

// 2) 추적되는 소스에서 secret 유사 패턴 스캔
const sourceList = sh('git ls-files src test scripts labs.gitignore 2>/dev/null')
  .split('\n').map(s => s.trim()).filter(Boolean);
for (const f of sourceList) {
  if (!existsSync(f)) continue;
  const text = readFileSync(f, 'utf8');
  if (secretLike.some(p => p.test(text))) violations.push(`secret 유사 패턴: ${f}`);
}

if (violations.length) {
  console.error('✗ policy-check 실패');
  for (const v of violations) console.error('  - ' + v);
  process.exit(1);
}
console.log(`✓ policy-check 통과 (변경 파일 ${changed.length}개 검사)`);
