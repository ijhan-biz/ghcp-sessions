#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync,
  renameSync, writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
export const ROOT = realpathSync(resolve(dirname(SCRIPT), '..'));
const MANIFEST_FILE = join(ROOT, 'lab-manifest.json');
const STATE_FILE = join(ROOT, '.lab-state.json');
const WORK_DIR = join(ROOT, 'lab-work');
const BACKUP_DIR = join(ROOT, '.lab-backups');

export function loadManifest(root = ROOT) {
  return JSON.parse(readFileSync(join(root, 'lab-manifest.json'), 'utf8'));
}

function loadState(root = ROOT) {
  const file = join(root, '.lab-state.json');
  if (!existsSync(file)) return { version: 1, passed: {}, fallback: {} };
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch { return { version: 1, passed: {}, fallback: {} }; }
}

function saveState(state, root = ROOT) {
  writeFileSync(join(root, '.lab-state.json'), `${JSON.stringify(state, null, 2)}\n`);
}

function run(command, args, root = ROOT) {
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env });
  return {
    ok: result.status === 0,
    status: result.status,
    output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
  };
}

const npmRun = (script, root = ROOT) => process.platform === 'win32'
  ? run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run ${script} --silent`], root)
  : run('npm', ['run', script, '--silent'], root);
const text = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const includesAll = (value, markers) => markers.every((marker) => value.includes(marker));
const pass = (detail, output = '') => ({ ok: true, detail, output });
const block = (detail, output = '') => ({ ok: false, detail, output });

const workedExamples = {
  baseline: '예: Node 18+와 git 확인 → 프로젝트 루트에서 baseline 숫자 기록.',
  'feature-spec': '예: 금지=외부 패키지/민감 로그, 검증=npm test처럼 금지와 검증을 한 쌍으로 적습니다.',
  ac: '예: 정상=유효 입력, 예외=무효 입력, 경계=임계값과 정확히 같은 입력을 각각 검증합니다.',
  context: '예: allowed=수정 파일, test=검증 파일, blocked=비밀/운영 경로, unknown=추정 금지 대상을 분리합니다.',
  plan: '예: RED에서 멈춤 → 최소 구현 → GREEN → gate, 각 단계에 rollback을 연결합니다.',
  'spec-pack': '예: 스펙·AC·Context·Plan을 새 요구 추가 없이 하나의 실행 계약으로 묶습니다.',
  readiness: '예: YELLOW | 이유=경계 AC 누락 | 다음 행동=AC 보강 | Owner=학습자.',
  'day2-ready': '예: package.json name과 pwd가 같은 프로젝트를 가리키는지 확인합니다.',
  policy: '예: read는 허용, destructive 명령은 거부하고 이유·호출 내역을 기록한 뒤 policy-check를 실행합니다.',
  'gate-canvas': '예: Generator와 다른 Evaluator가 AC 근거로 revise하고, Harness가 gate 실패에서 중단합니다.',
  workflow: '예: 요약은 자동화하고 최종 수용은 Human Gate로 남기며 동일 실패 2회에 중단합니다.',
  red: '예: 구현을 바꾸지 않은 채 새 테스트가 대상 요구에서 실패해야 정상 RED입니다.',
  green: '예: AI 첫 답을 AC와 실패 테스트에 대조해 수용/거부한 뒤 최소 구현합니다.',
  packet: '예: CLEAN/FALLBACK, 부채 owner/due, rollback trigger/owner/verify를 리뷰어가 재실행 가능하게 적습니다.',
  skill: '예: 입력 1개가 절차를 거쳐 어떤 출력 1개가 되는지 목적·금지와 함께 적습니다.',
  handoff: '예: 교육 GO와 실제 적용 NO-GO를 분리하고 근거·provenance·다음 owner를 적습니다.',
};

function baseline(root) {
  const result = run(process.execPath, ['--test', 'test/activity.test.js'], root);
  const good = result.ok
    && /(?:#|ℹ) pass 5\b/.test(result.output)
    && /(?:#|ℹ) skipped 2\b/.test(result.output)
    && /(?:#|ℹ) fail 0\b/.test(result.output);
  return good ? pass('5 pass / 2 skip / 0 fail', result.output) : block('baseline 숫자가 5/2/0이 아닙니다.', result.output);
}

function commandCheck(script, label, root) {
  const result = npmRun(script, root);
  return result.ok ? pass(`${label} PASS`, result.output) : block(`${label} 실패`, result.output);
}

function fileCheck(path, markers, label) {
  const value = text(path);
  if (!value) return block(`${label} 파일이 없습니다: ${relative(ROOT, path)}`);
  const missing = markers.filter((marker) => !value.includes(marker));
  return missing.length ? block(`${label} 누락: ${missing.join(', ')}`) : pass(`${label} 구조 확인`);
}

function learnerFileCheck(path, markers, label, placeholders) {
  const structure = fileCheck(path, markers, label);
  if (!structure.ok) return structure;
  const value = text(path);
  const unresolved = placeholders.filter((placeholder) => value.includes(placeholder));
  return unresolved.length
    ? block(`${label} 미작성 항목이 남아 있습니다: ${unresolved.join(', ')}`)
    : structure;
}

function all(results) {
  const failed = results.find((item) => !item.ok);
  return failed || pass(results.map((item) => item.detail).join(' · '));
}

function workspaceProof(root) {
  const file = join(root, 'lab-work', 'workspace-proof.json');
  if (!existsSync(file)) return block('VS Code Task "Lab: Verify Workspace Root"를 실행하세요.');
  try {
    const proof = JSON.parse(readFileSync(file, 'utf8'));
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const good = proof.verified === true
      && realpathSync(proof.workspaceRoot) === realpathSync(root)
      && proof.packageName === packageJson.name;
    return good ? pass('VS Code workspace root 확인') : block('workspace proof가 현재 프로젝트와 다릅니다.');
  } catch {
    return block('workspace proof를 읽을 수 없습니다. VS Code Task를 다시 실행하세요.');
  }
}

export function evaluateStep(step, root = ROOT) {
  const work = join(root, 'lab-work');
  switch (step.check) {
    case 'baseline': return baseline(root);
    case 'feature-spec':
      return learnerFileCheck(
        join(work, 'feature-spec.md'),
        ['기능명', '제외 범위', '민감정보 제거 확인', '검증 명령'],
        'Feature Spec',
        ['[D1-S1 작성]'],
      );
    case 'ac':
      return learnerFileCheck(
        join(work, 'feature-spec.md'),
        ['User Story', 'Acceptance Criteria', '정상', '예외', '경계'],
        'AC',
        ['[D1-S2 작성]'],
      );
    case 'context':
      return learnerFileCheck(
        join(work, 'context-manifest.md'),
        ['src/activity.js', 'test/activity.test.js', '.env', 'unknown'],
        'Context Manifest',
        ['[D1-S3 작성]'],
      );
    case 'plan':
      return learnerFileCheck(
        join(work, 'plan-and-test-matrix.md'),
        ['sessionize', '정상', '예외', '경계', 'Rollback'],
        'Plan/Test Matrix',
        ['[D1-S4 작성]'],
      );
    case 'spec-pack': {
      const file = join(work, 'spec.md');
      if (!existsSync(file)) return block('lab-work/spec.md가 없습니다. start d1-s5를 실행하세요.');
      const authored = learnerFileCheck(
        file,
        ['Feature Spec', 'Context Manifest', 'Plan + Test Matrix'],
        'Spec Pack',
        ['[D1-S1 작성]', '[D1-S2 작성]', '[D1-S3 작성]', '[D1-S4 작성]'],
      );
      if (!authored.ok) return authored;
      const result = run(process.execPath, ['scripts/spec-check.mjs', 'lab-work/spec.md'], root);
      return result.ok ? pass('Spec Pack PASS', result.output) : block('spec-check 실패', result.output);
    }
    case 'readiness':
      return all([
        learnerFileCheck(
          join(work, 'readiness.md'),
          ['GREEN/YELLOW/RED', '상태', '사유', '다음 행동', 'Owner'],
          'Day2 준비도 기록',
          ['[D1-S6 작성]'],
        ),
        commandCheck('env', 'env', root),
        baseline(root),
        evaluateStep({ check: 'spec-pack' }, root),
      ]);
    case 'day2-ready':
      return all([
        workspaceProof(root),
        commandCheck('env', 'env', root),
        baseline(root),
        evaluateStep({ check: 'spec-pack' }, root),
      ]);
    case 'policy':
      return all([
        learnerFileCheck(
          join(work, 'tool-approval.md'),
          ['preventive', '허용 도구', '거부 도구', '거부 이유', '호출 내역'],
          '도구 승인 기록',
          ['[D2-S1 작성]'],
        ),
        commandCheck('policy-check', 'policy-check', root),
      ]);
    case 'gate-canvas':
      return all([
        learnerFileCheck(
          join(work, 'agent-team-canvas.md'),
          ['Generator', 'Evaluator', '독립', 'pass/revise/block', '중단 조건', 'Gate'],
          'Agent Team Canvas',
          ['[D2-S2 작성]'],
        ),
        commandCheck('gate', 'gate', root),
      ]);
    case 'workflow':
      return all([
        learnerFileCheck(
          join(work, 'workflow.md'),
          ['Loop Canvas', '반복 업무', '자동화 범위', 'Human Gate', '중단 조건', '사람 리뷰'],
          'Workflow',
          ['[D2-S3 작성]'],
        ),
        commandCheck('sim', 'sim', root),
      ]);
    case 'red': {
      const source = text(join(root, 'src/activity.js'));
      const testFile = text(join(root, 'test/activity.test.js'));
      if (testFile.includes('{ skip: true }')) return block('skip 2개가 아직 남아 있습니다.');
      if (!source.includes('TODO(Day2-S4)')) return block('이미 구현된 상태입니다. RED를 보려면 reset d2-s4를 실행하세요.');
      const result = run(process.execPath, ['--test', 'test/activity.test.js'], root);
      return !result.ok && /sessionize/.test(result.output)
        ? pass('의도된 RED 확인(sessionize 실패)', result.output)
        : block('sessionize에서 실패하는 RED가 아닙니다.', result.output);
    }
    case 'green': {
      const decision = learnerFileCheck(
        join(work, 'implementation-decision.md'),
        ['AI 첫 답', '수용/거부', 'AC 근거', '테스트 근거'],
        'AI 구현 판단 기록',
        ['[D2-S4 작성]'],
      );
      if (!decision.ok) return decision;
      const testFile = text(join(root, 'test/activity.test.js'));
      if (testFile.includes('{ skip: true }')) return block('skip이 남아 있습니다. 테스트를 활성화하세요.');
      const result = run(process.execPath, ['--test', 'test/activity.test.js'], root);
      const good = result.ok && /(?:#|ℹ) pass 7\b/.test(result.output) && /(?:#|ℹ) skipped 0\b/.test(result.output);
      return good ? pass('7 pass / 0 skip / 0 fail', result.output) : block('GREEN 숫자가 7/0/0이 아닙니다.', result.output);
    }
    case 'packet':
      return all([
        learnerFileCheck(
          join(root, 'review-packet.md'),
          ['Local Review Packet', '테스트 결과', '정책 체크', 'Execution Provenance', 'Status:', 'Learning Debt', 'Owner:', 'Due:', 'D+7 Reimplementation', 'Rollback Note'],
          'Review Packet',
          ['[D2-S5 작성]'],
        ),
        commandCheck('gate', 'gate', root),
      ]);
    case 'skill':
      return learnerFileCheck(
        join(work, 'my-skill.md'),
        ['## 목적', '## 입력', '## 절차', '## 금지', '## 출력'],
        'Custom Skill',
        ['[D2-S6 작성]'],
      );
    case 'handoff': {
      const result = learnerFileCheck(
        join(work, 'handoff.md'),
        ['대표 3명 × 3분', '슬라이드 3장', '현업 적용 액션 3개', 'PL Handoff', '만든 것', '다음 단계', '교육 산출물 판정', '실제 업무·차량 기능 적용 판정', 'Execution Provenance', 'D+7 재학습 부채'],
        'Handoff',
        ['[D2-S7 작성]'],
      );
      if (!result.ok) return result;
      const packet = text(join(root, 'review-packet.md'));
      const status = packet.match(/^- Status: (CLEAN|FALLBACK|REFERENCE-MATCH)$/m)?.[1];
      if (!status) return block('Review Packet provenance가 없습니다. d2-s5를 먼저 완료하세요.');
      return text(join(work, 'handoff.md')).includes(status)
        ? result
        : block(`Handoff provenance가 Review Packet(${status})과 다릅니다.`);
    }
    default: return block(`알 수 없는 checker: ${step.check}`);
  }
}

function ensureDir(path) { mkdirSync(path, { recursive: true }); }

function copyIfMissing(from, to) {
  ensureDir(dirname(to));
  if (!existsSync(to)) copyFileSync(from, to);
}

function assembleSpec(root = ROOT) {
  const work = join(root, 'lab-work');
  ensureDir(work);
  const parts = [
    ['# Self-paced Spec Pack', ''],
    ['## Feature Spec', text(join(work, 'feature-spec.md')) || text(join(root, 'FEATURE-SPEC.md'))],
    ['## Context Manifest', text(join(work, 'context-manifest.md')) || text(join(root, 'templates/context-manifest.md'))],
    ['## Plan + Test Matrix', text(join(work, 'plan-and-test-matrix.md')) || text(join(root, 'templates/plan-and-test-matrix.md'))],
  ];
  writeFileSync(join(work, 'spec.md'), `${parts.map(([title, body]) => `${title}\n\n${body}`).join('\n\n')}\n`);
}

export function scaffoldStep(stepId, root = ROOT) {
  const work = join(root, 'lab-work');
  ensureDir(work);
  switch (stepId) {
    case 'd1-s1':
    case 'd1-s2': copyIfMissing(join(root, 'templates/feature-spec-card.md'), join(work, 'feature-spec.md')); break;
    case 'd1-s3': copyIfMissing(join(root, 'templates/context-manifest.md'), join(work, 'context-manifest.md')); break;
    case 'd1-s4': copyIfMissing(join(root, 'templates/plan-and-test-matrix.md'), join(work, 'plan-and-test-matrix.md')); break;
    case 'd1-s5':
      scaffoldStep('d1-s1', root); scaffoldStep('d1-s3', root); scaffoldStep('d1-s4', root); assembleSpec(root); break;
    case 'd1-s6': copyIfMissing(join(root, 'templates/readiness-record.md'), join(work, 'readiness.md')); break;
    case 'd2-s1': copyIfMissing(join(root, 'templates/tool-approval-record.md'), join(work, 'tool-approval.md')); break;
    case 'd2-s2': copyIfMissing(join(root, 'templates/agent-team-fleet-loop-canvas.md'), join(work, 'agent-team-canvas.md')); break;
    case 'd2-s3': copyIfMissing(join(root, 'templates/workflow-starter.md'), join(work, 'workflow.md')); break;
    case 'd2-s4-green': copyIfMissing(join(root, 'templates/implementation-decision.md'), join(work, 'implementation-decision.md')); break;
    case 'd2-s6': copyIfMissing(join(root, 'templates/custom-skill-starter.md'), join(work, 'my-skill.md')); break;
    case 'd2-s7': copyIfMissing(join(root, 'templates/lightning-talk-and-handoff.md'), join(work, 'handoff.md')); break;
    default: break;
  }
}

function timestamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

export function backupAndCopy(from, to, root = ROOT) {
  if (existsSync(to)) {
    const backup = join(root, '.lab-backups', timestamp(), relative(root, to));
    ensureDir(dirname(backup));
    copyFileSync(to, backup);
  }
  ensureDir(dirname(to));
  copyFileSync(from, to);
}

function clearFrom(stepId, state, manifest) {
  const index = manifest.steps.findIndex((item) => item.id === stepId);
  for (const item of manifest.steps.slice(Math.max(index, 0))) {
    delete state.passed[item.id];
    delete state.fallback[item.id];
  }
}

function resetStep(step, state, manifest, root = ROOT) {
  if (step.reset === 'd2-s4') {
    backupAndCopy(join(root, 'fixtures/baseline/activity.js'), join(root, 'src/activity.js'), root);
    backupAndCopy(join(root, 'fixtures/baseline/activity-test.fixture'), join(root, 'test/activity.test.js'), root);
    const decision = join(root, 'lab-work', 'implementation-decision.md');
    if (existsSync(decision)) renameSync(decision, `${decision}.bak-${timestamp()}`);
    scaffoldStep('d2-s4-green', root);
    clearFrom('d2-s4-red', state, manifest);
    return 'activity.js/test를 baseline(5 pass/2 skip)으로 복구했습니다.';
  }
  const targets = {
    'd1-s1': ['feature-spec.md'], 'd1-s2': ['feature-spec.md'],
    'd1-s3': ['context-manifest.md'], 'd1-s4': ['plan-and-test-matrix.md'],
    'd1-s5': ['spec.md'], 'd1-s6': ['readiness.md'], 'd2-s1': ['tool-approval.md'],
    'd2-s2': ['agent-team-canvas.md'], 'd2-s3': ['workflow.md'],
    'd2-s6': ['my-skill.md'], 'd2-s7': ['handoff.md'],
  }[step.id] || [];
  for (const name of targets) {
    const path = join(root, 'lab-work', name);
    if (existsSync(path)) renameSync(path, `${path}.bak-${timestamp()}`);
  }
  clearFrom(step.id, state, manifest);
  scaffoldStep(step.id, root);
  return targets.length ? '작성 파일을 백업하고 starter로 복구했습니다.' : '이 단계는 자동 reset 대상이 아닙니다.';
}

function recoverStep(step, state, root = ROOT) {
  if (step.id !== 'd2-s4-green') {
    return { ok: false, detail: 'recover는 d2-s4-green에만 제공합니다. 일반 단계는 hint/reset 뒤 질문하세요.' };
  }
  backupAndCopy(join(root, 'fixtures/solved/activity.js'), join(root, 'src/activity.js'), root);
  backupAndCopy(join(root, 'fixtures/solved/activity-test.fixture'), join(root, 'test/activity.test.js'), root);
  state.passed['d2-s4-red'] = new Date().toISOString();
  state.passed['d2-s4-green'] = new Date().toISOString();
  state.fallback['d2-s4-green'] = 'solution checkpoint restore';
  return { ok: true, detail: 'solution checkpoint로 복구했습니다. 직접 구현 대신 fallback 사용으로 기록됩니다.' };
}

function tail(value, lines = 8) { return value.split('\n').slice(-lines).join('\n'); }

function printStep(step) {
  console.log(`\n=== ${step.id} · ${step.session} · ${step.title} (${step.minutes}m) ===`);
  console.log('실행:');
  for (const command of step.commands) console.log(`  ${command}`);
  console.log(`기대: ${step.expected}`);
  console.log(`점검: npm run lab -- check ${step.id}`);
}

export function validateManifest(manifest) {
  const ids = manifest.steps.map((step) => step.id);
  const unique = new Set(ids);
  const complete = manifest.steps.every((step) => step.id && step.session && step.minutes && step.check
    && step.error && step.commands?.length && step.expected && step.hints?.length >= 2);
  return { ok: unique.size === ids.length && complete, count: ids.length };
}

async function main(argv = process.argv.slice(2), root = ROOT) {
  const manifest = loadManifest(root);
  const validation = validateManifest(manifest);
  if (!validation.ok) { console.error('BLOCK E-MANIFEST: lab-manifest.json 구조 오류'); return 2; }
  const state = loadState(root);
  const [command = 'status', stepId, level = '1'] = argv;
  const step = manifest.steps.find((item) => item.id === stepId);

  if (command === 'status') {
    console.log(`Self-paced lab · ${Object.keys(state.passed).length}/${manifest.steps.length} checkpoint PASS`);
    for (const item of manifest.steps) {
      const mark = state.passed[item.id] ? (state.fallback[item.id] ? 'FALLBACK' : 'PASS') : 'PENDING';
      console.log(`${mark.padEnd(8)} ${item.id.padEnd(12)} ${item.title}`);
    }
    return 0;
  }
  if (command === 'next') {
    const next = manifest.steps.find((item) => !state.passed[item.id]);
    if (!next) console.log('모든 checkpoint 완료. D2-S7 handoff를 제출하세요.');
    else printStep(next);
    return 0;
  }
  if (command === 'doctor') {
    const results = [commandCheck('env', 'env', root), baseline(root)];
    const failed = results.find((item) => !item.ok);
    if (failed) { console.error(`BLOCK E-DOCTOR: ${failed.detail}\n${tail(failed.output)}`); return 1; }
    console.log('PASS doctor · 환경 GREEN · baseline 5/2/0');
    return 0;
  }
  if (!step) { console.error(`알 수 없는 step: ${stepId || '(없음)'}`); return 2; }

  if (command === 'start') {
    scaffoldStep(step.id, root);
    printStep(step);
    return 0;
  }
  if (command === 'hint') {
    const index = Math.max(1, Math.min(Number(level) || 1, step.hints.length)) - 1;
    console.log(`HINT ${index + 1}/${step.hints.length} · ${step.id}: ${step.hints[index]}`);
    if (index + 1 === step.hints.length) console.log(`다음 복구: npm run lab -- reset ${step.id}`);
    return 0;
  }
  if (command === 'example') {
    console.log(`EXAMPLE · ${step.id}: ${workedExamples[step.check] || '같은 구조의 비식별 예시를 작성하세요.'}`);
    console.log('예시를 그대로 복사하지 말고 현재 단계의 근거로 바꿔 작성한 뒤 check하세요.');
    return 0;
  }
  if (command === 'check') {
    const result = evaluateStep(step, root);
    if (!result.ok) {
      console.error(`BLOCK ${step.error} · ${result.detail}`);
      if (result.output) console.error(tail(result.output));
      console.error(`다음: npm run lab -- hint ${step.id} 1`);
      console.error(`질문 형식: [${step.error}] 실행 명령 + 마지막 로그 8줄`);
      return 1;
    }
    state.passed[step.id] = new Date().toISOString();
    saveState(state, root);
    console.log(`PASS ${step.id} · ${result.detail}`);
    return 0;
  }
  if (command === 'reset') {
    console.log(resetStep(step, state, manifest, root));
    saveState(state, root);
    return 0;
  }
  if (command === 'recover') {
    const result = recoverStep(step, state, root);
    if (!result.ok) { console.error(`BLOCK E-RECOVER-SCOPE · ${result.detail}`); return 1; }
    console.log(result.detail);
    saveState(state, root);
    return 0;
  }
  console.error(`알 수 없는 command: ${command}`);
  return 2;
}

function isMain() {
  try { return realpathSync(process.argv[1]) === realpathSync(SCRIPT); }
  catch { return false; }
}

if (isMain()) process.exitCode = await main();

export { main };