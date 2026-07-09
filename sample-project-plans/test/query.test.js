// test/query.test.js
// 조회(검색·필터·통계·렌더) — now 를 명시 인자로 넘겨 결정론 검증.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState, addBoard, addList, addCard, addBoardMember, addLabelDef,
  assignLabel, addCardMember, setDue, editCard, archiveCard,
  addChecklist, addChecklistItem, toggleChecklistItem,
  search, boardStats, renderBoard,
} from '../src/plans.js';

const NOW = 10_000;
const DAY = 24 * 60 * 60 * 1000;

function fixture() {
  let s = initialState();
  s = addBoard(s, { id: 'b1', title: 'B', at: 1 });
  s = addBoardMember(s, { boardId: 'b1', memberId: 'alice' });
  s = addLabelDef(s, { boardId: 'b1', id: 'red', name: '긴급', color: 'red' });
  s = addLabelDef(s, { boardId: 'b1', id: 'green', name: '기능', color: 'green' });
  s = addList(s, { id: 'l1', boardId: 'b1', title: 'To Do', at: 2 });
  s = addList(s, { id: 'l2', boardId: 'b1', title: 'Done', at: 3 });
  // c1: green + alice + 설명 'login' + 마감 지남(overdue)
  s = addCard(s, { id: 'c1', listId: 'l1', title: '로그인 개선', at: 4 });
  s = editCard(s, { cardId: 'c1', desc: 'login flow' });
  s = assignLabel(s, { cardId: 'c1', labelId: 'green' });
  s = addCardMember(s, { cardId: 'c1', memberId: 'alice' });
  s = setDue(s, { cardId: 'c1', at: NOW - DAY });
  // c2: red + 마감 미래
  s = addCard(s, { id: 'c2', listId: 'l1', title: '결제 버그', at: 5 });
  s = assignLabel(s, { cardId: 'c2', labelId: 'red' });
  s = setDue(s, { cardId: 'c2', at: NOW + DAY });
  // c3: 라벨 없음, 마감 없음, 보관됨
  s = addCard(s, { id: 'c3', listId: 'l2', title: '릴리스 노트', at: 6 });
  s = archiveCard(s, { cardId: 'c3' });
  return s;
}

test('search: 텍스트 부분일치(제목+설명)', () => {
  const s = fixture();
  assert.deepEqual(search(s, { text: 'login', now: NOW }).map((c) => c.id), ['c1']);
  assert.deepEqual(search(s, { text: '버그', now: NOW }).map((c) => c.id), ['c2']);
});

test('search: 라벨/멤버 필터(AND)', () => {
  const s = fixture();
  assert.deepEqual(search(s, { labelIds: ['green'], now: NOW }).map((c) => c.id), ['c1']);
  assert.deepEqual(search(s, { memberIds: ['alice'], now: NOW }).map((c) => c.id), ['c1']);
  assert.deepEqual(search(s, { labelIds: ['red'], memberIds: ['alice'], now: NOW }).map((c) => c.id), []); // 교집합 없음
});

test('search: 마감 상태 필터', () => {
  const s = fixture();
  assert.deepEqual(search(s, { due: 'overdue', now: NOW }).map((c) => c.id), ['c1']);
  assert.deepEqual(search(s, { due: 'set', now: NOW }).map((c) => c.id).sort(), ['c1', 'c2']);
  assert.deepEqual(search(s, { due: 'none', now: NOW }).map((c) => c.id), []); // 활성 카드는 모두 마감 있음
});

test('경계: 기본 검색은 보관 카드 제외, 옵션으로 포함', () => {
  const s = fixture();
  assert.equal(search(s, { now: NOW }).some((c) => c.id === 'c3'), false);
  assert.equal(search(s, { includeArchived: true, now: NOW }).some((c) => c.id === 'c3'), true);
});

test('boardStats: 리스트별 수·overdue·체크리스트 롤업', () => {
  let s = fixture();
  s = addChecklist(s, { cardId: 'c1', id: 'cl', title: 't' });
  s = addChecklistItem(s, { cardId: 'c1', checklistId: 'cl', id: 'i1', text: 'a' });
  s = addChecklistItem(s, { cardId: 'c1', checklistId: 'cl', id: 'i2', text: 'b' });
  s = toggleChecklistItem(s, { cardId: 'c1', checklistId: 'cl', itemId: 'i1', done: true });
  const st = boardStats(s, 'b1', { now: NOW });
  assert.equal(st.total, 2);       // 활성 c1,c2 (c3 보관 제외)
  assert.equal(st.archived, 1);    // c3
  assert.equal(st.overdue, 1);     // c1
  assert.deepEqual(st.lists.map((l) => [l.title, l.count]), [['To Do', 2], ['Done', 0]]);
  assert.deepEqual(st.checklist, { done: 1, total: 2, percent: 50 });
});

test('renderBoard: 뷰 모델(라벨 풀이·overdue 플래그·요약 지표)', () => {
  const s = fixture();
  const v = renderBoard(s, 'b1', { now: NOW });
  assert.equal(v.title, 'B');
  assert.equal(v.lists.length, 2);
  const c1 = v.lists[0].cards[0];
  assert.equal(c1.title, '로그인 개선');
  assert.deepEqual(c1.labels.map((l) => l.name), ['기능']); // labelId → {name}
  assert.equal(c1.due.overdue, true);
  // 보관 카드는 기본 렌더에서 빠진다
  assert.equal(v.lists[1].cards.length, 0);
});

test('예외: 없는 보드 조회는 null/빈값', () => {
  const s = fixture();
  assert.equal(boardStats(s, 'nope'), null);
  assert.equal(renderBoard(s, 'nope'), null);
});
