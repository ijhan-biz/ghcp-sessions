import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COURSE_MODEL_SELECTION,
  routeModel,
} from '../scripts/model-routing-demo.mjs';

test('routeModel: blind-v2 활동별 모델과 F2/N0 경계를 고정한다', () => {
  const expected = {
    connect: ['F0', 'gpt-5.3-codex'],
    specification: ['F1', 'gpt-5.6-luna'],
    plan: ['F2', 'none'],
    generate: ['F3', 'gpt-5.4-mini'],
    evaluate: ['F4', 'claude-sonnet-5'],
    tutor: ['F5', 'gemini-3-flash-preview'],
    gate: ['N0', 'none'],
  };

  for (const [stage, [family, model]] of Object.entries(expected)) {
    assert.equal(routeModel(stage).family, family);
    assert.equal(routeModel(stage).model, model);
  }
  assert.equal(routeModel('plan').tier, 'human-first');
  assert.equal(routeModel('gate').tier, 'checker-first');
});

test('COURSE_MODEL_SELECTION: run provenance와 45명 Credit 목표를 고정한다', () => {
  assert.equal(COURSE_MODEL_SELECTION.benchmarkRuns, 196);
  assert.equal(COURSE_MODEL_SELECTION.retainedAttempts, 267);
  assert.equal(COURSE_MODEL_SELECTION.primaryRuns, 132);
  assert.equal(COURSE_MODEL_SELECTION.externalScreenRuns, 35);
  assert.equal(COURSE_MODEL_SELECTION.confirmationAttempts, 29);
  assert.equal(COURSE_MODEL_SELECTION.stableConfirmationRuns, 12);
  assert.equal(COURSE_MODEL_SELECTION.failedConfirmationRuns, 17);
  assert.equal(COURSE_MODEL_SELECTION.experimentCreditsEstimate, 218.4625);
  assert.equal(COURSE_MODEL_SELECTION.cohort45CreditsEstimate, 3780.04);
  assert.ok(COURSE_MODEL_SELECTION.cohort45CreditsEstimate < COURSE_MODEL_SELECTION.cohortTarget);
});

test('team-orchestrator: F3 실행과 F4/N0 handoff 경계를 고정한다', () => {
  const agent = readFileSync(new URL('../.github/agents/team-orchestrator.agent.md', import.meta.url), 'utf8');

  assert.match(agent, /Human Plan Gate/);
  assert.match(agent, /자기 diff를 pass\/revise\/block 판정하지 않는다/);
  assert.match(agent, /이 agent는 최종 `npm run gate`를 실행하거나 합격을 판정하지 않는다/);
  assert.match(agent, /모델 세션 밖의 사람\/Task가 `npm run gate`를 실행/);
  assert.doesNotMatch(agent, /\*\*Gate \(Harness\)\*\*[^\n]*`npm run gate`[^\n]*실행/);
});