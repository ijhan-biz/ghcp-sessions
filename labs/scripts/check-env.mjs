#!/usr/bin/env node
// scripts/check-env.mjs
// Day1-S0 / Day2-S0: 무설치 환경 준비도 점검. Green/Yellow/Red 로 자가 판정.
import { execSync } from 'node:child_process';

function probe(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim().split('\n')[0];
  } catch { return null; }
}

const node = process.versions.node;
const nodeMajor = Number(node.split('.')[0]);
const git = probe('git --version');
const gh = probe('gh --version');
const docker = probe('docker --version');

const rows = [
  ['Node 18+', nodeMajor >= 18 ? `ok (v${node})` : `RED (v${node})`],
  ['git', git ? `ok (${git})` : 'RED (없음)'],
  ['gh CLI', gh ? `ok (${gh})` : 'YELLOW (없음 → Copilot Chat fallback)'],
  ['Docker', docker ? `ok (${docker})` : 'YELLOW (없음 → Host Node fallback)'],
];

console.log('=== 환경 준비도 점검 (Day1-S0 / Day2-S0) ===');
for (const [k, v] of rows) console.log(`  ${k.padEnd(10)} : ${v}`);

const red = nodeMajor < 18 || !git;
const yellow = !gh || !docker;
const grade = red ? 'RED' : yellow ? 'YELLOW' : 'GREEN';

console.log(`\n준비도: ${grade}`);
console.log(
  grade === 'GREEN' ? '→ 바로 실습 가능'
  : grade === 'YELLOW' ? '→ fallback 경로로 진행 가능(Copilot Chat / Host Node)'
  : '→ Node 18+ 와 git 을 먼저 설치하세요'
);

// labs 자체는 Node 만 있으면 동작하므로 RED(Node/git 누락)만 실패로 처리.
process.exit(red ? 1 : 0);
