#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadManifest, validateManifest } from './lab-runner.mjs';

function rng(seed) {
  let value = seed % 2147483647;
  return () => (value = value * 48271 % 2147483647) / 2147483647;
}

const profiles = [
  {
    name: '준비형', probabilities: [0.03, 0.04, 0.02, 0.10, 0.04],
    thresholds: [0.72, 0.90, 0.98, 0.998],
  },
  {
    name: '혼합형', probabilities: [0.10, 0.10, 0.06, 0.24, 0.10],
    thresholds: [0.58, 0.82, 0.94, 0.995],
  },
  {
    name: '복구집중형', probabilities: [0.20, 0.16, 0.12, 0.38, 0.18],
    thresholds: [0.45, 0.72, 0.90, 0.985],
  },
];

const issueNames = ['환경', '스펙', 'workspace', 'SDD', 'packet/skill'];

export function simulateCohorts({ runs = 30, participants = 45, seed = 20260711 } = {}) {
  const manifest = loadManifest();
  const validation = validateManifest(manifest);
  if (!validation.ok) throw new Error('invalid lab manifest');
  const random = rng(seed);
  const rows = [];

  for (let index = 0; index < runs; index++) {
    const profile = profiles[index % profiles.length];
    const counts = {
      issues: 0, hint1: 0, hint2: 0, reset: 0, example: 0, recover: 0, instructor: 0,
      completed: participants, handoff: participants, speakers: 3,
    };
    const byType = Object.fromEntries(issueNames.map((name) => [name, 0]));

    for (let participant = 0; participant < participants; participant++) {
      profile.probabilities.forEach((probability, issueIndex) => {
        if (random() >= probability) return;
        counts.issues += 1;
        byType[issueNames[issueIndex]] += 1;
        const recovery = random();
        if (recovery < profile.thresholds[0]) counts.hint1 += 1;
        else if (recovery < profile.thresholds[1]) counts.hint2 += 1;
        else if (recovery < profile.thresholds[2]) counts.reset += 1;
        else if (recovery < profile.thresholds[3] && issueNames[issueIndex] === 'SDD') counts.recover += 1;
        else if (recovery < profile.thresholds[3]) counts.example += 1;
        else counts.instructor += 1;
      });
    }

    const selfResolved = counts.issues - counts.instructor;
    rows.push({
      run: index + 1,
      profile: profile.name,
      ...counts,
      selfServiceRate: counts.issues ? selfResolved / counts.issues : 1,
      broadcasts: Math.ceil(counts.instructor / 3),
      end: '18:00',
      byType,
    });
  }
  return rows;
}

export function summarize(rows) {
  const total = rows.reduce((acc, row) => {
    for (const key of ['issues', 'hint1', 'hint2', 'reset', 'example', 'recover', 'instructor', 'completed', 'handoff', 'speakers', 'broadcasts']) {
      acc[key] = (acc[key] || 0) + row[key];
    }
    return acc;
  }, {});
  total.participants = rows.reduce((sum, row) => sum + row.completed, 0);
  total.selfServiceRate = total.issues ? (total.issues - total.instructor) / total.issues : 1;
  total.maxInstructor = Math.max(...rows.map((row) => row.instructor));
  total.maxRecover = Math.max(...rows.map((row) => row.recover));
  return total;
}

function print(rows) {
  const total = summarize(rows);
  console.log('=== Self-paced Lab Dry-run · 30 cohorts × 45 participants ===');
  console.log('run profile       issues h1 h2 reset example recover ask handoff speakers end');
  for (const row of rows) {
    console.log(
      `${String(row.run).padStart(2)}  ${row.profile.padEnd(12)} `
      + `${String(row.issues).padStart(3)} ${String(row.hint1).padStart(2)} ${String(row.hint2).padStart(2)} `
      + `${String(row.reset).padStart(5)} ${String(row.example).padStart(7)} ${String(row.recover).padStart(7)} ${String(row.instructor).padStart(3)} `
      + `${String(row.handoff).padStart(7)} ${String(row.speakers).padStart(8)} ${row.end}`,
    );
  }
  console.log('--- aggregate ---');
  console.log(`cohorts=${rows.length} participants=${total.participants} checkpoints=16`);
  console.log(`issues=${total.issues} self_service=${(total.selfServiceRate * 100).toFixed(1)}% instructor_questions=${total.instructor}`);
  console.log(`hint1=${total.hint1} hint2=${total.hint2} reset=${total.reset} example=${total.example} recover=${total.recover}`);
  console.log(`handoff=${total.handoff}/${total.participants} representative_talks=${total.speakers} (3/run)`);
  console.log(`max_instructor_questions_per_run=${total.maxInstructor} max_checkpoint_restores_per_run=${total.maxRecover}`);
}

function isMain() {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isMain()) print(simulateCohorts());