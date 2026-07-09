// test/board.test.js
// 구조(보드/리스트/카드) — 정상·예외·경계. 순수 함수라 상태를 직접 넘겨 검증한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState, addBoard, renameBoard, archiveBoard, deleteBoard,
  addBoardMember, removeBoardMember,
  addList, renameList, archiveList, deleteList, moveList,
  addCard, editCard, archiveCard, deleteCard, moveCard,
  listsOf, cardsOf,
} from '../src/plans.js';

// 보드1 + 리스트 2개 + 카드 몇 개를 만든 픽스처.
function fixture() {
  let s = initialState();
  s = addBoard(s, { id: 'b1', title: 'Board', at: 1 });
  s = addList(s, { id: 'l1', boardId: 'b1', title: 'To Do', at: 2 });
  s = addList(s, { id: 'l2', boardId: 'b1', title: 'Doing', at: 3 });
  s = addCard(s, { id: 'c1', listId: 'l1', title: 'A', at: 4 });
  s = addCard(s, { id: 'c2', listId: 'l1', title: 'B', at: 5 });
  s = addCard(s, { id: 'c3', listId: 'l1', title: 'C', at: 6 });
  return s;
}

/* --------------------------------- 정상 --------------------------------- */

test('addBoard/addList/addCard: 정상 생성 + order 반영', () => {
  const s = fixture();
  assert.equal(s.boards.b1.title, 'Board');
  assert.deepEqual(s.boards.b1.listOrder, ['l1', 'l2']);
  assert.deepEqual(s.lists.l1.cardOrder, ['c1', 'c2', 'c3']);
  assert.equal(s.cards.c1.listId, 'l1');
});

test('rename/archive: 보드·리스트·카드 상태 변경', () => {
  let s = fixture();
  s = renameBoard(s, { boardId: 'b1', title: '새 보드' });
  s = renameList(s, { listId: 'l1', title: '할 일' });
  s = archiveCard(s, { cardId: 'c2' });
  assert.equal(s.boards.b1.title, '새 보드');
  assert.equal(s.lists.l1.title, '할 일');
  assert.equal(s.cards.c2.archived, true);
  // archived 카드는 기본 조회에서 제외
  assert.deepEqual(cardsOf(s, 'l1').map((c) => c.id), ['c1', 'c3']);
});

test('boardMember: 추가는 멱등, 제거 동작', () => {
  let s = fixture();
  s = addBoardMember(s, { boardId: 'b1', memberId: 'alice' });
  s = addBoardMember(s, { boardId: 'b1', memberId: 'alice' }); // 중복 무시
  assert.deepEqual(s.boards.b1.memberIds, ['alice']);
  s = removeBoardMember(s, { boardId: 'b1', memberId: 'alice' });
  assert.deepEqual(s.boards.b1.memberIds, []);
});

/* --------------------------------- 이동 --------------------------------- */

test('moveCard: 같은 리스트 내 재정렬', () => {
  let s = fixture();
  s = moveCard(s, { cardId: 'c3', toIndex: 0 }); // C 를 맨 앞으로
  assert.deepEqual(s.lists.l1.cardOrder, ['c3', 'c1', 'c2']);
});

test('moveCard: 다른 리스트로 이동 + listId 갱신', () => {
  let s = fixture();
  s = moveCard(s, { cardId: 'c1', toListId: 'l2', toIndex: 0 });
  assert.deepEqual(s.lists.l1.cardOrder, ['c2', 'c3']);
  assert.deepEqual(s.lists.l2.cardOrder, ['c1']);
  assert.equal(s.cards.c1.listId, 'l2');
});

test('moveList: 보드 안 리스트 순서 이동', () => {
  let s = fixture();
  s = moveList(s, { listId: 'l2', toIndex: 0 });
  assert.deepEqual(s.boards.b1.listOrder, ['l2', 'l1']);
});

/* ------------------------------ 경계·예외 ------------------------------- */

test('경계: moveCard toIndex 범위 밖은 끝으로 clamp', () => {
  let s = fixture();
  s = moveCard(s, { cardId: 'c1', toListId: 'l1', toIndex: 99 });
  assert.deepEqual(s.lists.l1.cardOrder, ['c2', 'c3', 'c1']);
});

test('예외: 필수값 없거나 부모 없으면 no-op', () => {
  let s = fixture();
  assert.equal(addBoard(s, { id: 'b2', title: '  ' }), s);        // 빈 title
  assert.equal(addList(s, { id: 'lx', boardId: 'nope', title: 'X' }), s); // 없는 보드
  assert.equal(addCard(s, { id: 'cx', listId: 'nope', title: 'X' }), s);  // 없는 리스트
  assert.equal(addBoard(s, { id: 'b1', title: '중복' }), s);       // 중복 id
  assert.equal(moveCard(s, { cardId: 'nope', toListId: 'l1' }), s); // 없는 카드
});

test('delete: 리스트 삭제 시 하위 카드와 order 정리', () => {
  let s = fixture();
  s = deleteList(s, { listId: 'l1' });
  assert.equal(s.lists.l1, undefined);
  assert.equal(s.cards.c1, undefined);
  assert.deepEqual(s.boards.b1.listOrder, ['l2']);
});

test('delete: 보드 삭제 시 리스트·카드 모두 정리', () => {
  let s = fixture();
  s = deleteBoard(s, { boardId: 'b1' });
  assert.deepEqual(s.boards, {});
  assert.deepEqual(s.lists, {});
  assert.deepEqual(s.cards, {});
});

test('archiveList: 기본 조회에서 보관 리스트 제외', () => {
  let s = fixture();
  s = archiveList(s, { listId: 'l2' });
  assert.deepEqual(listsOf(s, 'b1').map((l) => l.id), ['l1']);
  assert.deepEqual(listsOf(s, 'b1', { includeArchived: true }).map((l) => l.id), ['l1', 'l2']);
});

test('불변성: 원본 상태는 변형되지 않는다', () => {
  const s = fixture();
  const before = JSON.stringify(s);
  addCard(s, { id: 'c9', listId: 'l1', title: 'Z', at: 9 });
  archiveCard(s, { cardId: 'c1' });
  assert.equal(JSON.stringify(s), before);
});
