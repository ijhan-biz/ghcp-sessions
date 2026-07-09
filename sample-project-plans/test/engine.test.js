// test/engine.test.js
// 엔진(부수효과 경계) — 결정론 idgen/clock 주입, 메서드 체이닝, 복사 합성, 저장 라운드트립.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, seedDemoBoard, memoryStore, checklistProgress } from '../src/plans.js';

// 결정론 엔진: id 는 순번, 시간은 고정.
function det(start = 0) {
  let n = 0;
  const store = memoryStore();
  const e = createEngine({ idgen: () => `id${++n}`, clock: () => start, store });
  return { e, store };
}

test('엔진: id 는 주입한 idgen 순번으로 부여', () => {
  const { e } = det();
  const b = e.addBoard('B');
  const l = e.addList(b, 'L');
  const c = e.addCard(l, 'C');
  assert.deepEqual([b, l, c], ['id1', 'id2', 'id3']);
  assert.equal(e.board(b).title, 'B');
});

test('엔진: 체이닝 + 조회 셀렉터', () => {
  const { e } = det();
  const b = e.addBoard('B');
  const l = e.addList(b, 'L');
  const c = e.addCard(l, 'C');
  e.editCard(c, { desc: 'hello' }).archiveCard(c, false);
  assert.equal(e.cards(l).length, 1);
  assert.equal(e.state.cards[c].desc, 'hello');
});

test('copyCard: 라벨·멤버·마감·체크리스트 깊은 복사(코멘트 제외, 새 id)', () => {
  const { e } = det(5000);
  const b = e.addBoard('B');
  e.addBoardMember(b, 'alice');
  const red = e.addLabel(b, '긴급', 'red');
  const l = e.addList(b, 'L');
  const c = e.addCard(l, '원본');
  e.assignLabel(c, red).addCardMember(c, 'alice').setDue(c, 9999);
  const cl = e.addChecklist(c, '작업');
  const it = e.addChecklistItem(c, cl, '설계');
  e.toggleChecklistItem(c, cl, it, true);
  e.addComment(c, 'alice', '메모'); // 복사 대상 아님

  const copyId = e.copyCard(c);
  const copy = e.state.cards[copyId];
  assert.notEqual(copyId, c);
  assert.equal(copy.title, '원본');
  assert.deepEqual(copy.labelIds, [red]);
  assert.deepEqual(copy.memberIds, ['alice']);
  assert.equal(copy.due.at, 9999);
  assert.deepEqual(checklistProgress(copy), { done: 1, total: 1, percent: 100 });
  assert.equal(copy.comments.length, 0);                 // 코멘트는 복사 안 함
  assert.notEqual(copy.checklists[0].id, cl);            // 중첩 id 도 새로 부여
  // 원본 리스트에 원본+복사 2장
  assert.equal(e.cards(l).length, 2);
});

test('copyList: 리스트와 활성 카드 전체 복제', () => {
  const { e } = det();
  const b = e.addBoard('B');
  const l = e.addList(b, 'To Do');
  e.addCard(l, 'A');
  e.addCard(l, 'B');
  const copyId = e.copyList(l);
  assert.notEqual(copyId, l);
  assert.equal(e.cards(copyId).length, 2);
  assert.equal(e.lists(b).length, 2);
});

test('copyBoard: 멤버·라벨(재매핑)·리스트·카드까지 복제', () => {
  const { e } = det();
  const b = e.addBoard('원본 보드');
  e.addBoardMember(b, 'alice');
  const red = e.addLabel(b, '긴급', 'red');
  const l = e.addList(b, 'L');
  const c = e.addCard(l, 'C');
  e.assignLabel(c, red);

  const copyId = e.copyBoard(b, { title: '복제 보드' });
  const cb = e.board(copyId);
  assert.equal(cb.title, '복제 보드');
  assert.deepEqual(cb.memberIds, ['alice']);
  assert.equal(cb.labels.length, 1);
  assert.notEqual(cb.labels[0].id, red);          // 라벨 id 재매핑
  const copiedCard = e.cards(cb.listOrder[0])[0];
  assert.deepEqual(copiedCard.labelIds, [cb.labels[0].id]); // 카드가 새 라벨 id 참조
});

test('엔진: 저장 후 load 라운드트립', async () => {
  const { e, store } = det();
  const b = e.addBoard('B');
  e.addList(b, 'L');
  assert.equal(await e.save(), true);

  const e2 = createEngine({ store });
  await e2.load();
  assert.equal(e2.board(b).title, 'B');
});

test('seedDemoBoard: 완성 보드 시드가 통계와 맞물린다', () => {
  const { e } = det(100_000);
  const b = seedDemoBoard(e, { now: 100_000 });
  const st = e.stats(b, { now: 100_000 });
  assert.equal(st.total, 4);      // 시드 카드 4장(활성)
  assert.equal(st.overdue, 1);    // 결제 버그 카드 마감 지남
  assert.ok(st.lists.length === 3);
});
