#!/usr/bin/env node
// scripts/check-env.mjs
// Day1-S0 / Day2-S0: 무설치 환경 준비도 점검. Green/Red 로 자가 판정(labs 와 동일 기준).
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

const rows = [
  ['Node 18+', nodeMajor >= 18 ? `ok (v${node})` : `RED (v${node})`],
  ['git', git ? `ok (${git})` : 'RED (없음)'],
];

console.log('=== 환경 준비도 점검 (sample-project-plans) ===');
for (const [k, v] of rows) console.log(`  ${k.padEnd(10)} : ${v}`);

const red = nodeMajor < 18 || !git;
console.log(`\n준비도: ${red ? 'RED' : 'GREEN'}`);
console.log(red ? '→ Node 18+ 와 git 을 먼저 설치하세요' : '→ 바로 실습 가능 (npm test)');
process.exit(red ? 1 : 0);
