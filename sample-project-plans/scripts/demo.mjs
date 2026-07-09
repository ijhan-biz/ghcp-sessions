#!/usr/bin/env node
// scripts/demo.mjs
// 완성본 데모 — 시드 보드를 만들어 Trello 유형 화면을 텍스트로 렌더한다.
//   결정론(idgen/clock 주입)으로 매번 같은 결과. `npm run demo` 로 실행.
import { createEngine, seedDemoBoard } from '../src/plans.js';

const FIXED_NOW = Date.parse('2026-07-09T09:00:00Z');
let n = 0;
const engine = createEngine({ idgen: () => `id${++n}`, clock: () => FIXED_NOW });
const boardId = seedDemoBoard(engine, { now: FIXED_NOW });

const view = engine.render(boardId, { now: FIXED_NOW });
const stats = engine.stats(boardId, { now: FIXED_NOW });

const badge = (c) => {
  const bits = [];
  if (c.labels.length) bits.push(c.labels.map((l) => `#${l.name}`).join(' '));
  if (c.members.length) bits.push(`@${c.members.join(' @')}`);
  if (c.due) bits.push(c.due.overdue ? '⏰지남' : '⏳예정');
  if (c.checklist.total) bits.push(`☑ ${c.checklist.done}/${c.checklist.total}`);
  if (c.comments) bits.push(`💬${c.comments}`);
  if (c.attachments) bits.push(`📎${c.attachments}`);
  return bits.length ? `  [${bits.join(' · ')}]` : '';
};

console.log(`\n=== 보드: ${view.title} (멤버: ${view.members.join(', ')}) ===`);
for (const list of view.lists) {
  console.log(`\n▸ ${list.title} (${list.cards.length})`);
  for (const c of list.cards) console.log(`   • ${c.title}${badge(c)}`);
}
console.log('\n--- 통계 ---');
console.log(`  카드 ${stats.total} · 보관 ${stats.archived} · 마감초과 ${stats.overdue} · 체크리스트 ${stats.checklist.percent}%`);
console.log('  (검색 예) 마감초과:', engine.overdue(FIXED_NOW).map((c) => c.title).join(', ') || '없음');
console.log('');
