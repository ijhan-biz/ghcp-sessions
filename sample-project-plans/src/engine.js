// src/engine.js
// Plans 엔진 — 순수 코어(board/card/query)를 감싸 **부수효과 경계**를 제공한다.
//   - id 생성(idgen)·시각(clock)·영속화(store) 를 **주입**받는다. 미주입이면 안전한 기본값.
//     → 테스트는 결정론 idgen(카운터)·고정 clock 을 주입해 재현 가능하게 검증한다.
//   - create* 메서드는 **생성된 id 를 반환**(참조 편의), 나머지 변경 메서드는 엔진(api)을 반환(체이닝).
//   - copyCard/copyList/copyBoard 는 새 id 가 여러 개 필요한 **합성 연산**이라 엔진에 둔다.

import { initialState } from './state.js';
import * as B from './board.js';
import * as C from './card.js';
import * as Q from './query.js';
import { loadState, saveState } from './store.js';

export function createEngine({ idgen, clock, store, state } = {}) {
  let _state = state || initialState();
  let _seq = 0;
  const newId = typeof idgen === 'function' ? idgen : () => `id_${++_seq}`;
  const now = typeof clock === 'function' ? clock : () => Date.now();
  const set = (s) => { _state = s; return _state; };

  /* 합성 복사의 핵심: 소스 카드를 targetList 로 깊은 복사(새 id). 코멘트/보관은 복사 안 함. */
  function dupCardInto(s, src, targetListId, labelMap) {
    const id = newId();
    let ns = B.addCard(s, { id, listId: targetListId, title: src.title, at: now() });
    if (ns === s) return { s, id: null }; // 대상 리스트 없음 등 → 실패
    ns = B.editCard(ns, { cardId: id, desc: src.desc });
    for (const lid of src.labelIds) {
      const mapped = labelMap ? labelMap[lid] : lid;
      if (mapped) ns = C.assignLabel(ns, { cardId: id, labelId: mapped });
    }
    for (const mid of src.memberIds) ns = C.addCardMember(ns, { cardId: id, memberId: mid });
    if (src.due) ns = C.setDue(ns, { cardId: id, at: src.due.at, done: src.due.done });
    for (const cl of src.checklists) {
      const clId = newId();
      ns = C.addChecklist(ns, { cardId: id, id: clId, title: cl.title });
      for (const it of cl.items) {
        const itId = newId();
        ns = C.addChecklistItem(ns, { cardId: id, checklistId: clId, id: itId, text: it.text });
        if (it.done) ns = C.toggleChecklistItem(ns, { cardId: id, checklistId: clId, itemId: itId, done: true });
      }
    }
    for (const a of src.attachments) ns = C.addAttachment(ns, { cardId: id, id: newId(), name: a.name, url: a.url, at: now() });
    return { s: ns, id };
  }

  const api = {
    get state() { return _state; },
    reset(s) { _state = s || initialState(); return api; },

    /* --------------------------- 보드 --------------------------- */
    addBoard(title) { const id = newId(); set(B.addBoard(_state, { id, title, at: now() })); return id; },
    renameBoard(boardId, title) { set(B.renameBoard(_state, { boardId, title })); return api; },
    archiveBoard(boardId, archived = true) { set(B.archiveBoard(_state, { boardId, archived })); return api; },
    unarchiveBoard(boardId) { set(B.archiveBoard(_state, { boardId, archived: false })); return api; },
    deleteBoard(boardId) { set(B.deleteBoard(_state, { boardId })); return api; },
    addBoardMember(boardId, memberId) { set(B.addBoardMember(_state, { boardId, memberId })); return api; },
    removeBoardMember(boardId, memberId) { set(B.removeBoardMember(_state, { boardId, memberId })); return api; },
    addLabel(boardId, name, color = 'gray') { const id = newId(); set(B.addLabelDef(_state, { boardId, id, name, color })); return id; },
    updateLabel(boardId, id, patch = {}) { set(B.updateLabelDef(_state, { boardId, id, ...patch })); return api; },
    removeLabel(boardId, id) { set(B.removeLabelDef(_state, { boardId, id })); return api; },

    /* --------------------------- 리스트 -------------------------- */
    addList(boardId, title) { const id = newId(); set(B.addList(_state, { id, boardId, title, at: now() })); return id; },
    renameList(listId, title) { set(B.renameList(_state, { listId, title })); return api; },
    archiveList(listId, archived = true) { set(B.archiveList(_state, { listId, archived })); return api; },
    deleteList(listId) { set(B.deleteList(_state, { listId })); return api; },
    moveList(listId, toIndex) { set(B.moveList(_state, { listId, toIndex })); return api; },

    /* ---------------------------- 카드 --------------------------- */
    addCard(listId, title) { const id = newId(); set(B.addCard(_state, { id, listId, title, at: now() })); return id; },
    editCard(cardId, patch = {}) { set(B.editCard(_state, { cardId, ...patch })); return api; },
    archiveCard(cardId, archived = true) { set(B.archiveCard(_state, { cardId, archived })); return api; },
    deleteCard(cardId) { set(B.deleteCard(_state, { cardId })); return api; },
    moveCard(cardId, toListId, toIndex) { set(B.moveCard(_state, { cardId, toListId, toIndex })); return api; },

    /* ------------------------ 카드 상세 -------------------------- */
    assignLabel(cardId, labelId) { set(C.assignLabel(_state, { cardId, labelId })); return api; },
    unassignLabel(cardId, labelId) { set(C.unassignLabel(_state, { cardId, labelId })); return api; },
    addCardMember(cardId, memberId) { set(C.addCardMember(_state, { cardId, memberId })); return api; },
    removeCardMember(cardId, memberId) { set(C.removeCardMember(_state, { cardId, memberId })); return api; },
    setDue(cardId, at, done = false) { set(C.setDue(_state, { cardId, at, done })); return api; },
    clearDue(cardId) { set(C.clearDue(_state, { cardId })); return api; },
    completeDue(cardId, done = true) { set(C.setDueDone(_state, { cardId, done })); return api; },
    addChecklist(cardId, title) { const id = newId(); set(C.addChecklist(_state, { cardId, id, title })); return id; },
    removeChecklist(cardId, checklistId) { set(C.removeChecklist(_state, { cardId, checklistId })); return api; },
    addChecklistItem(cardId, checklistId, text) { const id = newId(); set(C.addChecklistItem(_state, { cardId, checklistId, id, text })); return id; },
    toggleChecklistItem(cardId, checklistId, itemId, done) { set(C.toggleChecklistItem(_state, { cardId, checklistId, itemId, done })); return api; },
    removeChecklistItem(cardId, checklistId, itemId) { set(C.removeChecklistItem(_state, { cardId, checklistId, itemId })); return api; },
    addComment(cardId, author, text) { const id = newId(); set(C.addComment(_state, { cardId, id, author, text, at: now() })); return id; },
    editComment(cardId, id, text) { set(C.editComment(_state, { cardId, id, text })); return api; },
    removeComment(cardId, id) { set(C.removeComment(_state, { cardId, id })); return api; },
    addAttachment(cardId, name, url = '') { const id = newId(); set(C.addAttachment(_state, { cardId, id, name, url, at: now() })); return id; },
    removeAttachment(cardId, id) { set(C.removeAttachment(_state, { cardId, id })); return api; },

    /* ---------------------------- 복사 --------------------------- */
    copyCard(cardId, { toListId, toIndex } = {}) {
      const src = _state.cards[cardId];
      if (!src) return null;
      const { s, id } = dupCardInto(_state, src, toListId || src.listId, null);
      if (!id) return null;
      let ns = s;
      if (Number.isInteger(toIndex)) ns = B.moveCard(ns, { cardId: id, toListId: toListId || src.listId, toIndex });
      set(ns);
      return id;
    },
    copyList(listId, { title } = {}) {
      const src = _state.lists[listId];
      if (!src) return null;
      const id = newId();
      let ns = B.addList(_state, { id, boardId: src.boardId, title: title || `${src.title} (copy)`, at: now() });
      if (ns === _state) return null;
      for (const cid of src.cardOrder) {
        const c = ns.cards[cid];
        if (c && !c.archived) ({ s: ns } = dupCardInto(ns, c, id, null));
      }
      set(ns);
      return id;
    },
    copyBoard(boardId, { title } = {}) {
      const src = _state.boards[boardId];
      if (!src) return null;
      const id = newId();
      let ns = B.addBoard(_state, { id, title: title || `${src.title} (copy)`, at: now() });
      for (const m of src.memberIds) ns = B.addBoardMember(ns, { boardId: id, memberId: m });
      const labelMap = {};
      for (const lab of src.labels) {
        const nid = newId();
        labelMap[lab.id] = nid;
        ns = B.addLabelDef(ns, { boardId: id, id: nid, name: lab.name, color: lab.color });
      }
      for (const lid of src.listOrder) {
        const l = ns.lists[lid] || _state.lists[lid];
        if (!l || l.archived) continue;
        const nlid = newId();
        ns = B.addList(ns, { id: nlid, boardId: id, title: l.title, at: now() });
        for (const cid of l.cardOrder) {
          const c = _state.cards[cid];
          if (c && !c.archived) ({ s: ns } = dupCardInto(ns, c, nlid, labelMap));
        }
      }
      set(ns);
      return id;
    },

    /* -------------------------- 조회(현재 상태) ------------------------- */
    board(boardId) { return Q.getBoard(_state, boardId); },
    boards(opts) { return Q.boards(_state, opts); },
    lists(boardId, opts) { return Q.listsOf(_state, boardId, opts); },
    cards(listId, opts) { return Q.cardsOf(_state, listId, opts); },
    search(opts) { return Q.search(_state, opts); },
    stats(boardId, opts) { return Q.boardStats(_state, boardId, opts); },
    render(boardId, opts) { return Q.renderBoard(_state, boardId, opts); },
    overdue(now2 = now()) { return Q.search(_state, { due: 'overdue', now: now2 }); },

    /* --------------------------- 영속화 경계 --------------------------- */
    async load() { _state = await loadState({ store }); return _state; },
    async save() { return saveState(_state, { store }); },
  };

  return api;
}

/**
 * 데모 시드 — 완성 보드 하나를 채운다(문서/데모/스크린샷용).
 * 결정론이 필요하면 idgen/clock 을 주입한 엔진을 넘겨라.
 */
export function seedDemoBoard(engine, { now = Date.now() } = {}) {
  const day = 24 * 60 * 60 * 1000;
  const b = engine.addBoard('제품 로드맵');
  engine.addBoardMember(b, 'alice');
  engine.addBoardMember(b, 'bob');
  const red = engine.addLabel(b, '긴급', 'red');
  const green = engine.addLabel(b, '기능', 'green');
  const todo = engine.addList(b, 'To Do');
  const doing = engine.addList(b, 'Doing');
  const done = engine.addList(b, 'Done');

  const c1 = engine.addCard(todo, '온보딩 플로우 개선');
  engine.editCard(c1, { desc: '가입 전환율 +5% 목표' });
  engine.assignLabel(c1, green);
  engine.addCardMember(c1, 'alice');
  engine.setDue(c1, now + 2 * day);
  const cl = engine.addChecklist(c1, '작업');
  const it1 = engine.addChecklistItem(c1, cl, '와이어프레임');
  engine.addChecklistItem(c1, cl, '구현');
  engine.toggleChecklistItem(c1, cl, it1, true);
  engine.addComment(c1, 'bob', '디자인 시안 공유했습니다.');

  const c2 = engine.addCard(todo, '결제 버그 수정');
  engine.assignLabel(c2, red);
  engine.setDue(c2, now - 1 * day); // 이미 지남 → overdue
  engine.addCardMember(c2, 'bob');

  const c3 = engine.addCard(doing, '검색 성능 튜닝');
  engine.assignLabel(c3, green);

  engine.addCard(done, '릴리스 노트 작성');
  engine.moveCard(c2, doing, 0); // Doing 맨 앞으로 이동
  return b;
}
