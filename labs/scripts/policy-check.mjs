#!/usr/bin/env node
// scripts/policy-check.mjs
// Day2-S2: 로컬 정책 체크(결정론적 게이트). PR/Actions 없이 로컬에서 금지 변경을 막는다.
// 감지: 금지 경로(.env, secrets/, prod/) 변경 · secret 유사 패턴 · 외부 의존성 추가.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

function git(args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch { return ''; }
}

function lines(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

// 1) tracked·untracked·ignored 금지 경로를 모두 변경 표면에 포함한다.
const gitPrefix = git(['rev-parse', '--show-prefix']).trim();
const trackedChanges = lines(git(['diff', '--name-only', '--relative', 'HEAD', '--', '.']));
const untracked = lines(git(['ls-files', '--others', '--exclude-standard', '--', '.']));
const ignoredBlocked = lines(git([
  'ls-files', '--others', '--ignored', '--exclude-standard', '--',
  '.env', '.env.*', ':(glob)**/.env', ':(glob)**/.env.*',
  ':(glob)**/secret/**', ':(glob)**/secrets/**', ':(glob)**/prod/**',
]));
const changed = [...new Set([...trackedChanges, ...untracked, ...ignoredBlocked])].sort();

const blockedPaths = [/(^|\/)\.env(?:\.|$)/, /(^|\/)secrets?\//, /(^|\/)prod\//];
const secretLike = [/AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /ghp_[A-Za-z0-9]{20,}/];

const violations = [];

for (const f of changed) {
  if (blockedPaths.some(p => p.test(f))) violations.push(`금지 경로 변경: ${f}`);
}

// 2) HEAD 대비 새 외부 의존성 키를 차단한다.
function packageJson(value) {
  try { return JSON.parse(value); } catch { return null; }
}

const currentPackage = existsSync('package.json') ? packageJson(readFileSync('package.json', 'utf8')) : null;
const baselinePackage = packageJson(git(['show', `HEAD:${gitPrefix}package.json`]));
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  const current = currentPackage?.[section] || {};
  const baseline = baselinePackage?.[section] || {};
  for (const name of Object.keys(current)) {
    if (!(name in baseline)) violations.push(`외부 의존성 추가: ${section}.${name}`);
  }
}

// 3) 추적 소스와 변경·untracked 파일에서 secret 유사 패턴을 스캔한다.
const trackedSource = lines(git(['ls-files', '--', 'src', 'test', 'scripts']));
const scanFiles = [...new Set([...trackedSource, ...changed])];
for (const f of scanFiles) {
  if (!existsSync(f)) continue;
  try {
    if (!statSync(f).isFile() || statSync(f).size > 1024 * 1024) continue;
  } catch { continue; }
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  if (secretLike.some(p => p.test(text))) violations.push(`secret 유사 패턴: ${f}`);
}

if (violations.length) {
  console.error('✗ policy-check 실패');
  for (const v of violations) console.error('  - ' + v);
  process.exit(1);
}
console.log(`✓ policy-check 통과 (변경 파일 ${changed.length}개 검사)`);
