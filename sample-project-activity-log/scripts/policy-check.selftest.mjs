import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, 'policy-check.mjs');

function command(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  return { status: result.status, output: `${result.stdout || ''}${result.stderr || ''}` };
}

function makeRepository() {
  const root = mkdtempSync(join(tmpdir(), 'policy-check-'));
  mkdirSync(join(root, 'scripts'), { recursive: true });
  copyFileSync(SOURCE, join(root, 'scripts/policy-check.mjs'));
  writeFileSync(join(root, '.gitignore'), '.env\nnode_modules/\n');
  writeFileSync(join(root, 'package.json'), '{"name":"policy-fixture","private":true,"type":"module"}\n');
  command('git', ['init', '-q'], root);
  command('git', ['config', 'user.email', 'policy@example.invalid'], root);
  command('git', ['config', 'user.name', 'Policy Test'], root);
  command('git', ['add', '.'], root);
  command('git', ['commit', '-qm', 'baseline'], root);
  return root;
}

function policy(root) {
  return command(process.execPath, ['scripts/policy-check.mjs'], root);
}

test('policy-check: clean repository passes', () => {
  const result = policy(makeRepository());
  assert.equal(result.status, 0, result.output);
});

test('policy-check: newly added external dependency blocks', () => {
  const root = makeRepository();
  writeFileSync(join(root, 'package.json'), '{"name":"policy-fixture","private":true,"type":"module","dependencies":{"left-pad":"1.3.0"}}\n');
  const result = policy(root);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /외부 의존성 추가: dependencies\.left-pad/);
});

test('policy-check: ignored untracked .env blocks', () => {
  const root = makeRepository();
  writeFileSync(join(root, '.env'), 'APP_MODE=local\n');
  const result = policy(root);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /금지 경로 변경: \.env/);
});