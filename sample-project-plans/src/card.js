// src/card.js
// 카드 내용 조작(순수) — 라벨 배정 · 멤버 · 마감일 · 체크리스트 · 코멘트 · 첨부.
// 규칙: 대상(카드/체크리스트/항목)이 없으면 no-op. 배정류는 **멱등**(중복 추가 안 함).
//   라벨/멤버 배정은 **보드에 정의/소속된 것만** 허용한다(정합성).

import { isStr, updateIn, boardOfCard } from './state.js';

/** cards[cardId] 를 fn 으로 갱신한 새 상태(없으면 no-op). */
const patchCard = (state, cardId, fn) => ({ ...state, cards: updateIn(state.cards, cardId, fn) });

/* --------------------------------- 라벨 ---------------------------------- */

/** 카드에 라벨 배정. 그 보드에 정의된 labelId 만, 멱등. */
export function assignLabel(state, { cardId, labelId } = {}) {
  const c = state.cards[cardId];
  if (!c) return state;
  const board = boardOfCard(state, c);
  if (!board || !board.labels.some((l) => l.id === labelId)) return state;
  if (c.labelIds.includes(labelId)) return state;
  return patchCard(state, cardId, (cc) => ({ ...cc, labelIds: [...cc.labelIds, labelId] }));
}

export function unassignLabel(state, { cardId, labelId } = {}) {
  return patchCard(state, cardId, (cc) => ({ ...cc, labelIds: cc.labelIds.filter((x) => x !== labelId) }));
}

/* --------------------------------- 멤버 ---------------------------------- */

/** 카드에 멤버 배정. **보드 멤버**만 허용, 멱등. */
export function addCardMember(state, { cardId, memberId } = {}) {
  const c = state.cards[cardId];
  if (!c || !isStr(memberId)) return state;
  const board = boardOfCard(state, c);
  if (!board || !board.memberIds.includes(memberId)) return state;
  if (c.memberIds.includes(memberId)) return state;
  return patchCard(state, cardId, (cc) => ({ ...cc, memberIds: [...cc.memberIds, memberId] }));
}

export function removeCardMember(state, { cardId, memberId } = {}) {
  return patchCard(state, cardId, (cc) => ({ ...cc, memberIds: cc.memberIds.filter((x) => x !== memberId) }));
}

/* -------------------------------- 마감일 --------------------------------- */

/** 마감일 설정. at 은 유효한 ms 여야 함. done 기본 false. */
export function setDue(state, { cardId, at, done = false } = {}) {
  if (!Number.isFinite(at)) return state;
  return patchCard(state, cardId, (cc) => ({ ...cc, due: { at, done: !!done } }));
}

export function clearDue(state, { cardId } = {}) {
  return patchCard(state, cardId, (cc) => ({ ...cc, due: null }));
}

/** 마감 완료 토글. due 가 없으면 no-op. done 미지정이면 뒤집는다. */
export function setDueDone(state, { cardId, done } = {}) {
  const c = state.cards[cardId];
  if (!c || !c.due) return state;
  const next = done === undefined ? !c.due.done : !!done;
  return patchCard(state, cardId, (cc) => ({ ...cc, due: { ...cc.due, done: next } }));
}

/* ------------------------------- 체크리스트 ------------------------------ */

export function addChecklist(state, { cardId, id, title } = {}) {
  const c = state.cards[cardId];
  if (!c || !isStr(id) || !isStr(title) || c.checklists.some((cl) => cl.id === id)) return state;
  return patchCard(state, cardId, (cc) => ({ ...cc, checklists: [...cc.checklists, { id, title: title.trim(), items: [] }] }));
}

export function removeChecklist(state, { cardId, checklistId } = {}) {
  return patchCard(state, cardId, (cc) => ({ ...cc, checklists: cc.checklists.filter((cl) => cl.id !== checklistId) }));
}

export function addChecklistItem(state, { cardId, checklistId, id, text } = {}) {
  const c = state.cards[cardId];
  if (!c || !isStr(id) || !isStr(text)) return state;
  const cl = c.checklists.find((x) => x.id === checklistId);
  if (!cl || cl.items.some((it) => it.id === id)) return state;
  return patchCard(state, cardId, (cc) => ({
    ...cc,
    checklists: cc.checklists.map((x) => (x.id === checklistId
      ? { ...x, items: [...x.items, { id, text: text.trim(), done: false }] }
      : x)),
  }));
}

/** 항목 완료 토글. done 미지정이면 뒤집는다. */
export function toggleChecklistItem(state, { cardId, checklistId, itemId, done } = {}) {
  return patchCard(state, cardId, (cc) => ({
    ...cc,
    checklists: cc.checklists.map((cl) => (cl.id === checklistId
      ? {
          ...cl,
          items: cl.items.map((it) => (it.id === itemId
            ? { ...it, done: done === undefined ? !it.done : !!done }
            : it)),
        }
      : cl)),
  }));
}

export function removeChecklistItem(state, { cardId, checklistId, itemId } = {}) {
  return patchCard(state, cardId, (cc) => ({
    ...cc,
    checklists: cc.checklists.map((cl) => (cl.id === checklistId
      ? { ...cl, items: cl.items.filter((it) => it.id !== itemId) }
      : cl)),
  }));
}

/* -------------------------------- 코멘트 --------------------------------- */

export function addComment(state, { cardId, id, author = '', text, at = 0 } = {}) {
  const c = state.cards[cardId];
  if (!c || !isStr(id) || !isStr(text) || c.comments.some((cm) => cm.id === id)) return state;
  return patchCard(state, cardId, (cc) => ({ ...cc, comments: [...cc.comments, { id, author, text: text.trim(), at }] }));
}

export function editComment(state, { cardId, id, text } = {}) {
  if (!isStr(text)) return state;
  return patchCard(state, cardId, (cc) => ({
    ...cc,
    comments: cc.comments.map((cm) => (cm.id === id ? { ...cm, text: text.trim() } : cm)),
  }));
}

export function removeComment(state, { cardId, id } = {}) {
  return patchCard(state, cardId, (cc) => ({ ...cc, comments: cc.comments.filter((cm) => cm.id !== id) }));
}

/* -------------------------------- 첨부 ----------------------------------- */
// 첨부는 **메타데이터(이름·URL)만** 다룬다. 실제 업로드/저장은 비목표(non-goal)이며
// 파일 I/O 는 부수효과라 순수 코어에서 제외한다(테스트 결정론). URL 은 선택.

export function addAttachment(state, { cardId, id, name, url = '', at = 0 } = {}) {
  const c = state.cards[cardId];
  if (!c || !isStr(id) || !isStr(name) || c.attachments.some((a) => a.id === id)) return state;
  return patchCard(state, cardId, (cc) => ({ ...cc, attachments: [...cc.attachments, { id, name: name.trim(), url, at }] }));
}

export function removeAttachment(state, { cardId, id } = {}) {
  return patchCard(state, cardId, (cc) => ({ ...cc, attachments: cc.attachments.filter((a) => a.id !== id) }));
}
