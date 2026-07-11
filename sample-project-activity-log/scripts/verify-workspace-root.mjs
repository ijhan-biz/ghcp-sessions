#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = realpathSync(resolve(dirname(SCRIPT), '..'));

export function verifyWorkspaceRoot(candidate, root = ROOT) {
  if (!candidate || !existsSync(candidate)) return { ok: false, detail: 'workspaceFolder 경로가 없습니다.' };
  const actual = realpathSync(candidate);
  const expected = realpathSync(root);
  if (actual !== expected) return { ok: false, detail: `현재 창 루트가 다릅니다: ${actual}` };
  const packageJson = JSON.parse(readFileSync(join(expected, 'package.json'), 'utf8'));
  return { ok: true, workspaceRoot: expected, packageName: packageJson.name };
}

export function writeWorkspaceProof(candidate, root = ROOT) {
  const result = verifyWorkspaceRoot(candidate, root);
  if (!result.ok) return result;
  const work = join(root, 'lab-work');
  mkdirSync(work, { recursive: true });
  writeFileSync(join(work, 'workspace-proof.json'), `${JSON.stringify({
    verified: true,
    workspaceRoot: result.workspaceRoot,
    packageName: result.packageName,
    checkedAt: new Date().toISOString(),
  }, null, 2)}\n`);
  return result;
}

function isMain() {
  try { return realpathSync(process.argv[1]) === realpathSync(SCRIPT); }
  catch { return false; }
}

if (isMain()) {
  const result = writeWorkspaceProof(process.argv[2]);
  if (!result.ok) {
    console.error(`BLOCK E-D2S0-WORKSPACE · ${result.detail}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS workspace · ${result.packageName} · ${result.workspaceRoot}`);
  }
}