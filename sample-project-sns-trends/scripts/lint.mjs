#!/usr/bin/env node
// scripts/lint.mjs
// 의존성 없는 최소 lint — src/test/scripts 의 .js/.mjs 를 `node --check` 로 구문 검사.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const roots = ['src', 'test', 'scripts'];
const targets = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(mjs|js)$/.test(name)) targets.push(p);
  }
}
for (const r of roots) { try { walk(r); } catch { /* 폴더 없으면 건너뜀 */ } }

let failed = 0;
for (const f of targets) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    failed++;
    console.error('✗ 구문 오류: ' + f);
    if (e.stderr) console.error(String(e.stderr).split('\n').slice(0, 3).join('\n'));
  }
}

if (failed) { console.error(`lint 실패 (${failed}/${targets.length})`); process.exit(1); }
console.log(`✓ lint 통과 (${targets.length} 파일 구문 검사)`);
