// test/card.test.js
// 카드 상세(라벨·멤버·마감·체크리스트·코멘트·첨부) — 정상·예외·경계.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState, addBoard, addList, addCard, addBoardMember, addLabelDef, removeLabelDef,
  assignLabel, unassignLabel, addCardMember, removeCardMember,
  setDue, clearDue, setDueDone,
  addChecklist, addChecklistItem, toggleChecklistItem, removeChecklist, removeChecklistItem,
  addComment, editComment, removeComment, addAttachment, removeAttachment,
  checklistProgress, isOverdue,
} from '../src/plans.js';

function fixture() {
  let s = initialState();
  s = addBoard(s, { id: 'b1', title: 'B', at: 1 });
  s = addBoardMember(s, { boardId: 'b1', memberId: 'alice' });
  s = addLabelDef(s, { boardId: 'b1', id: 'red', name: '긴급', color: 'red' });
  s = addList(s, { id: 'l1', boardId: 'b1', title: 'L', at: 2 });
  s = addCard(s, { id: 'c1', listId: 'l1', title: 'Card', at: 3 });
  return s;
}

/* --------------------------------- 라벨 --------------------------------- */

test('assignLabel: 보드에 정의된 라벨만, 멱등', () => {
  let s = fixture();
  s = assignLabel(s, { cardId: 'c1', labelId: 'red' });
  s = assignLabel(s, { cardId: 'c1', labelId: 'red' });   // 중복 무시
  s = assignLabel(s, { cardId: 'c1', labelId: 'ghost' }); // 미정의 → no-op
  assert.deepEqual(s.cards.c1.labelIds, ['red']);
  s = unassignLabel(s, { cardId: 'c1', labelId: 'red' });
  assert.deepEqual(s.cards.c1.labelIds, []);
});

test('removeLabelDef: 정의 삭제 시 카드 참조도 정리', () => {
  let s = fixture();
  s = assignLabel(s, { cardId: 'c1', labelId: 'red' });
  s = removeLabelDef(s, { boardId: 'b1', id: 'red' });
  assert.deepEqual(s.boards.b1.labels, []);
  assert.deepEqual(s.cards.c1.labelIds, []);
});

/* --------------------------------- 멤버 --------------------------------- */

test('addCardMember: 보드 멤버만 배정, 멱등', () => {
  let s = fixture();
  s = addCardMember(s, { cardId: 'c1', memberId: 'alice' });
  s = addCardMember(s, { cardId: 'c1', memberId: 'alice' }); // 중복 무시
  s = addCardMember(s, { cardId: 'c1', memberId: 'bob' });   // 보드 멤버 아님 → no-op
  assert.deepEqual(s.cards.c1.memberIds, ['alice']);
  s = removeCardMember(s, { cardId: 'c1', memberId: 'alice' });
  assert.deepEqual(s.cards.c1.memberIds, []);
});

/* -------------------------------- 마감일 -------------------------------- */

test('setDue/overdue/complete: 마감 상태 전이', () => {
  let s = fixture();
  s = setDue(s, { cardId: 'c1', at: 1000 });
  assert.deepEqual(s.cards.c1.due, { at: 1000, done: false });
  assert.equal(isOverdue(s.cards.c1, 2000), true);   // 지났고 미완 → overdue
  assert.equal(isOverdue(s.cards.c1, 500), false);   // 아직 안 지남
  s = setDueDone(s, { cardId: 'c1' });               // 토글 → done
  assert.equal(s.cards.c1.due.done, true);
  assert.equal(isOverdue(s.cards.c1, 2000), false);  // 완료면 overdue 아님
  s = clearDue(s, { cardId: 'c1' });
  assert.equal(s.cards.c1.due, null);
});

test('예외: setDue 에 유효하지 않은 at 은 no-op', () => {
  const s = fixture();
  assert.equal(setDue(s, { cardId: 'c1', at: NaN }), s);
  assert.equal(setDue(s, { cardId: 'c1', at: 'x' }), s);
  assert.equal(setDueDone(s, { cardId: 'c1' }), s); // due 없음 → no-op
});

/* ------------------------------ 체크리스트 ------------------------------ */

test('checklist: 항목 추가·토글·진행률', () => {
  let s = fixture();
  s = addChecklist(s, { cardId: 'c1', id: 'cl1', title: '작업' });
  s = addChecklistItem(s, { cardId: 'c1', checklistId: 'cl1', id: 'i1', text: '설계' });
  s = addChecklistItem(s, { cardId: 'c1', checklistId: 'cl1', id: 'i2', text: '구현' });
  assert.deepEqual(checklistProgress(s.cards.c1), { done: 0, total: 2, percent: 0 });
  s = toggleChecklistItem(s, { cardId: 'c1', checklistId: 'cl1', itemId: 'i1', done: true });
  assert.deepEqual(checklistProgress(s.cards.c1), { done: 1, total: 2, percent: 50 });
  s = toggleChecklistItem(s, { cardId: 'c1', checklistId: 'cl1', itemId: 'i1' }); // 토글 → 해제
  assert.deepEqual(checklistProgress(s.cards.c1), { done: 0, total: 2, percent: 0 });
});

test('경계: 항목 없는 카드 진행률은 0%', () => {
  const s = fixture();
  assert.deepEqual(checklistProgress(s.cards.c1), { done: 0, total: 0, percent: 0 });
});

test('checklist: 항목·체크리스트 삭제', () => {
  let s = fixture();
  s = addChecklist(s, { cardId: 'c1', id: 'cl1', title: '작업' });
  s = addChecklistItem(s, { cardId: 'c1', checklistId: 'cl1', id: 'i1', text: 'x' });
  s = removeChecklistItem(s, { cardId: 'c1', checklistId: 'cl1', itemId: 'i1' });
  assert.equal(s.cards.c1.checklists[0].items.length, 0);
  s = removeChecklist(s, { cardId: 'c1', checklistId: 'cl1' });
  assert.equal(s.cards.c1.checklists.length, 0);
});

/* -------------------------- 코멘트 · 첨부 ------------------------------- */

test('comment: 추가·수정·삭제', () => {
  let s = fixture();
  s = addComment(s, { cardId: 'c1', id: 'm1', author: 'alice', text: '안녕', at: 10 });
  assert.equal(s.cards.c1.comments[0].text, '안녕');
  s = editComment(s, { cardId: 'c1', id: 'm1', text: '수정됨' });
  assert.equal(s.cards.c1.comments[0].text, '수정됨');
  s = removeComment(s, { cardId: 'c1', id: 'm1' });
  assert.equal(s.cards.c1.comments.length, 0);
});

test('attachment: 메타데이터(이름·URL)만 추가·삭제', () => {
  let s = fixture();
  s = addAttachment(s, { cardId: 'c1', id: 'a1', name: 'spec.pdf', url: 'https://x/spec.pdf', at: 10 });
  assert.equal(s.cards.c1.attachments[0].name, 'spec.pdf');
  s = removeAttachment(s, { cardId: 'c1', id: 'a1' });
  assert.equal(s.cards.c1.attachments.length, 0);
});

test('예외: 없는 카드/필수값 누락은 no-op', () => {
  const s = fixture();
  assert.equal(addChecklist(s, { cardId: 'nope', id: 'x', title: 'y' }), s);
  assert.equal(addComment(s, { cardId: 'c1', id: 'm', text: '   ' }), s); // 빈 text
  assert.equal(addAttachment(s, { cardId: 'c1', id: 'a', name: '' }), s); // 빈 name
});
