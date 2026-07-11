import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
  ROOT, backupAndCopy, evaluateStep, loadManifest, main, scaffoldStep, validateManifest,
} from './lab-runner.mjs';
import { buildPacket } from './make-review-packet.mjs';
import { simulateCohorts, summarize } from './self-paced-dry-run.mjs';
import { verifyWorkspaceRoot, writeWorkspaceProof } from './verify-workspace-root.mjs';

test('manifest: 16개 checkpoint id가 유일하고 필수 필드를 가진다', () => {
  const manifest = loadManifest();
  const result = validateManifest(manifest);
  assert.deepEqual(result, { ok: true, count: 16 });
});

test('baseline checker: fresh 프로젝트는 5 pass / 2 skip', () => {
  const root = mkdtempSync(join(tmpdir(), 'lab-baseline-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'test'), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  copyFileSync(join(ROOT, 'fixtures/baseline/activity.js'), join(root, 'src/activity.js'));
  copyFileSync(join(ROOT, 'fixtures/baseline/activity-test.fixture'), join(root, 'test/activity.test.js'));
  const result = evaluateStep({ check: 'baseline' }, root);
  assert.equal(result.ok, true, result.detail);
});

test('RED checker: baseline 상태에서는 skip 때문에 block', () => {
  const result = evaluateStep({ check: 'red' });
  assert.equal(result.ok, false);
  assert.match(result.detail, /skip/);
});

test('hint command: 결정론적 힌트를 출력하고 성공 종료', async () => {
  const code = await main(['hint', 'd2-s4-green', '2']);
  assert.equal(code, 0);
});

test('example command: reset 이후 정답이 아닌 구조 예시를 제공한다', async () => {
  const code = await main(['example', 'd2-s1']);
  assert.equal(code, 0);
});

test('backupAndCopy: 기존 파일을 보존하고 fixture를 복사한다', () => {
  const root = mkdtempSync(join(tmpdir(), 'lab-runner-'));
  const from = join(root, 'fixture.txt');
  const to = join(root, 'nested', 'target.txt');
  mkdirSync(join(root, 'nested'), { recursive: true });
  writeFileSync(from, 'new');
  writeFileSync(to, 'old');
  backupAndCopy(from, to, root);
  assert.equal(readFileSync(to, 'utf8'), 'new');
});

test('작성형 checkpoint: start 직후에는 모두 BLOCK', () => {
  const root = mkdtempSync(join(tmpdir(), 'lab-starters-'));
  mkdirSync(join(root, 'templates'), { recursive: true });
  for (const name of [
    'feature-spec-card.md', 'context-manifest.md', 'plan-and-test-matrix.md',
    'readiness-record.md', 'tool-approval-record.md', 'agent-team-fleet-loop-canvas.md', 'workflow-starter.md',
    'implementation-decision.md', 'custom-skill-starter.md', 'lightning-talk-and-handoff.md',
  ]) copyFileSync(join(ROOT, 'templates', name), join(root, 'templates', name));

  const manifest = loadManifest();
  const ids = ['d1-s1', 'd1-s2', 'd1-s3', 'd1-s4', 'd1-s5', 'd1-s6', 'd2-s1', 'd2-s2', 'd2-s3', 'd2-s4-green', 'd2-s6', 'd2-s7'];
  for (const id of ids) {
    const step = manifest.steps.find((item) => item.id === id);
    scaffoldStep(id, root);
    const result = evaluateStep(step, root);
    assert.equal(result.ok, false, `${id} starter가 즉시 PASS했습니다.`);
    assert.match(result.detail, /미작성/);
  }
});

test('recover 범위: d2-s4-green 외 단계는 실패 종료', async () => {
  const root = mkdtempSync(join(tmpdir(), 'lab-recover-scope-'));
  copyFileSync(join(ROOT, 'lab-manifest.json'), join(root, 'lab-manifest.json'));
  const code = await main(['recover', 'd1-s1'], root);
  assert.equal(code, 1);
});

test('workspace proof: VS Code가 전달한 root 일치 여부를 기록한다', () => {
  const root = mkdtempSync(join(tmpdir(), 'lab-workspace-'));
  writeFileSync(join(root, 'package.json'), '{"name":"workspace-proof-test"}\n');
  assert.equal(verifyWorkspaceRoot(root, root).ok, true);
  assert.equal(verifyWorkspaceRoot(tmpdir(), root).ok, false);
  assert.equal(writeWorkspaceProof(root, root).ok, true);
  const proof = JSON.parse(readFileSync(join(root, 'lab-work/workspace-proof.json'), 'utf8'));
  assert.equal(proof.verified, true);
  assert.equal(proof.packageName, 'workspace-proof-test');
});

test('review packet: CLEAN/FALLBACK/REFERENCE-MATCH provenance를 구분한다', () => {
  const runCommand = () => 'PASS';
  const clean = buildPacket({ state: { fallback: {} }, runCommand, now: '2026-07-11T00:00:00.000Z' });
  assert.match(clean, /Status: CLEAN/);
  assert.match(clean, /D\+7 Reimplementation: N\/A/);

  const fallback = buildPacket({
    state: { fallback: { 'd2-s4-green': 'solution checkpoint restore' } },
    runCommand,
    now: '2026-07-11T00:00:00.000Z',
  });
  assert.match(fallback, /Status: FALLBACK/);
  assert.match(fallback, /Reference\/Recover Step: d2-s4-green/);
  assert.match(fallback, /Learning Debt/);
  assert.match(fallback, /D\+7 Reimplementation: \[D2-S5 작성\]/);

  const root = mkdtempSync(join(tmpdir(), 'lab-reference-match-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'fixtures/solved'), { recursive: true });
  copyFileSync(join(ROOT, 'fixtures/solved/activity.js'), join(root, 'src/activity.js'));
  copyFileSync(join(ROOT, 'fixtures/solved/activity.js'), join(root, 'fixtures/solved/activity.js'));
  const reference = buildPacket({ root, state: { fallback: {} }, runCommand, now: '2026-07-11T00:00:00.000Z' });
  assert.match(reference, /Status: REFERENCE-MATCH/);
  assert.match(reference, /source matches solved checkpoint without runner recover/);
  assert.match(reference, /D\+7 Reimplementation: \[D2-S5 작성\]/);
});

test('16단계 E2E: 학생 작성 증거 → RED → GREEN → packet → handoff', () => {
  const root = join(mkdtempSync(join(tmpdir(), 'lab-e2e-')), 'project');
  cpSync(ROOT, root, {
    recursive: true,
    filter(source) {
      const path = relative(ROOT, source);
      return !['.git', '.lab-state.json', '.lab-backups', 'lab-work', 'review-packet.md']
        .some((blocked) => path === blocked || path.startsWith(`${blocked}/`));
    },
  });

  const packageFile = join(root, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageFile, 'utf8'));
  packageJson.scripts.gate = 'npm run lint && npm test && npm run policy-check';
  writeFileSync(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`);

  const manifest = loadManifest(root);
  const passed = [];
  const complete = (id, token, value) => {
    scaffoldStep(id, root);
    const step = manifest.steps.find((item) => item.id === id);
    const targetById = {
      'd1-s1': 'feature-spec.md', 'd1-s2': 'feature-spec.md',
      'd1-s3': 'context-manifest.md', 'd1-s4': 'plan-and-test-matrix.md',
      'd1-s6': 'readiness.md', 'd2-s1': 'tool-approval.md',
      'd2-s2': 'agent-team-canvas.md', 'd2-s3': 'workflow.md',
      'd2-s4-green': 'implementation-decision.md', 'd2-s6': 'my-skill.md',
      'd2-s7': 'handoff.md',
    };
    if (token) {
      const file = join(root, 'lab-work', targetById[id]);
      const content = readFileSync(file, 'utf8');
      assert.match(content, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      writeFileSync(file, content.replaceAll(token, value));
    }
    const result = evaluateStep(step, root);
    assert.equal(result.ok, true, `${id}: ${result.detail}`);
    passed.push(id);
  };

  const baseline = evaluateStep(manifest.steps.find((item) => item.id === 'd1-s0'), root);
  assert.equal(baseline.ok, true, baseline.detail);
  passed.push('d1-s0');
  complete('d1-s1', '[D1-S1 작성]', '비식별 sessionize · npm test로 검증');
  complete('d1-s2', '[D1-S2 작성]', '유휴 경계를 검증한다');
  complete('d1-s3', '[D1-S3 작성]', '허용 이유와 실제 collector 제외');
  complete('d1-s4', '[D1-S4 작성]', 'RED 후 GREEN, owner가 npm run gate로 검증');
  scaffoldStep('d1-s5', root);
  const specPack = evaluateStep(manifest.steps.find((item) => item.id === 'd1-s5'), root);
  assert.equal(specPack.ok, true, specPack.detail);
  passed.push('d1-s5');
  complete('d1-s6', '[D1-S6 작성]', 'GREEN · 근거 확인 · 다음 단계 d2-s0 · Owner 학습자');

  assert.equal(writeWorkspaceProof(root, root).ok, true);
  const day2Ready = evaluateStep(manifest.steps.find((item) => item.id === 'd2-s0'), root);
  assert.equal(day2Ready.ok, true, day2Ready.detail);
  passed.push('d2-s0');
  complete('d2-s1', '[D2-S1 작성]', 'git read 허용 · 위험 명령 거부 · 호출 로그 기록');
  complete('d2-s2', '[D2-S2 작성]', '독립 리뷰어 · AC 근거 · 2회 실패 시 중단');
  complete('d2-s3', '[D2-S3 작성]', '셀프 리뷰 · diff만 자동화 · 최종 수용은 Human Gate');

  const testFile = join(root, 'test/activity.test.js');
  writeFileSync(testFile, readFileSync(testFile, 'utf8').replaceAll('{ skip: true }', '{}'));
  const red = evaluateStep(manifest.steps.find((item) => item.id === 'd2-s4-red'), root);
  assert.equal(red.ok, true, red.detail);
  passed.push('d2-s4-red');

  scaffoldStep('d2-s4-green', root);
  const decision = join(root, 'lab-work/implementation-decision.md');
  writeFileSync(decision, readFileSync(decision, 'utf8').replaceAll('[D2-S4 작성]', 'REJECT 후 AC와 테스트 근거로 수정'));
  const sourceFile = join(root, 'src/activity.js');
  const source = readFileSync(sourceFile, 'utf8');
  const implemented = source.replace(
    /export function sessionize\(events, idleGapMs = 5 \* 60 \* 1000\) \{\r?\n  \/\/ TODO\(Day2-S4\)\r?\n  return \[\];\r?\n\}/,
    `export function sessionize(events, idleGapMs = 5 * 60 * 1000) {
  const ordered = Array.isArray(events)
    ? events.filter(isValidEvent)
      .map((event) => ({ start: ms(event.start), end: ms(event.end) }))
      .sort((left, right) => left.start - right.start)
    : [];
  return ordered.reduce((sessions, event) => {
    const previous = sessions.at(-1);
    if (!previous || event.start - previous.end > idleGapMs) {
      sessions.push({ ...event, count: 1 });
    } else {
      previous.end = Math.max(previous.end, event.end);
      previous.count += 1;
    }
    return sessions;
  }, []);
}`,
  );
  assert.notEqual(implemented, source, 'sessionize TODO 교체 실패');
  writeFileSync(sourceFile, implemented);
  const green = evaluateStep(manifest.steps.find((item) => item.id === 'd2-s4-green'), root);
  assert.equal(green.ok, true, green.detail);
  passed.push('d2-s4-green');

  const packet = buildPacket({ root, state: { fallback: {} }, runCommand: () => 'PASS', now: '2026-07-11T00:00:00.000Z' });
  writeFileSync(join(root, 'review-packet.md'), packet.replaceAll('[D2-S5 작성]', 'Owner 학습자 · 2026-07-18'));
  const packetResult = evaluateStep(manifest.steps.find((item) => item.id === 'd2-s5'), root);
  assert.equal(packetResult.ok, true, packetResult.detail);
  passed.push('d2-s5');
  complete('d2-s6', '[D2-S6 작성]', '비식별 preflight 입력과 기대 출력');
  complete('d2-s7', '[D2-S7 작성]', '교육 GO · 실제 적용 NO-GO · CLEAN');

  assert.equal(passed.length, 16);
  assert.deepEqual(passed, manifest.steps.map((step) => step.id));
});

test('30회 dry-run: 45명 전원 handoff + 대표 3명 + 체크포인트 복구', () => {
  const rows = simulateCohorts();
  const total = summarize(rows);
  assert.equal(rows.length, 30);
  assert.ok(rows.every((row) => row.completed === 45 && row.handoff === 45 && row.speakers === 3));
  assert.equal(total.participants, 1350);
  assert.ok(total.selfServiceRate >= 0.98);
});