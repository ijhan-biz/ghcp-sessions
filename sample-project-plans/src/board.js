// src/board.js
// 구조 조작(순수) — 보드 / 리스트 / 카드의 생성·이름변경·이동·보관·삭제.
// 규칙: 부모가 없거나 필수값이 비면 **원본 상태를 그대로 반환(no-op)** 한다(안전 처리).
//   이동 인덱스는 [0, len] 으로 clamp 한다(경계). 모든 id·시각(at)은 호출자가 준다(결정론).

import { isStr, clamp, updateIn, removeKey } from './state.js';

/* ---------------------------------- 보드 --------------------------------- */

/** 보드 생성. id/title 필수, 같은 id 있으면 no-op. */
export function addBoard(state, { id, title, at = 0 } = {}) {
  if (!isStr(id) || !isStr(title) || state.boards[id]) return state;
  const board = {
    id, title: title.trim(), createdAt: at, archived: false,
    memberIds: [], labels: [], listOrder: [],
  };
  return { ...state, boards: { ...state.boards, [id]: board } };
}

export function renameBoard(state, { boardId, title } = {}) {
  if (!isStr(title)) return state;
  return { ...state, boards: updateIn(state.boards, boardId, (b) => ({ ...b, title: title.trim() })) };
}

export function archiveBoard(state, { boardId, archived = true } = {}) {
  return { ...state, boards: updateIn(state.boards, boardId, (b) => ({ ...b, archived: !!archived })) };
}

/** 보드 삭제(하위 리스트·카드까지 정리). 존재하지 않으면 no-op. */
export function deleteBoard(state, { boardId } = {}) {
  const b = state.boards[boardId];
  if (!b) return state;
  const lists = { ...state.lists };
  const cards = { ...state.cards };
  for (const listId of b.listOrder) {
    const l = lists[listId];
    if (!l) continue;
    for (const cid of l.cardOrder) delete cards[cid];
    delete lists[listId];
  }
  return { boards: removeKey(state.boards, boardId), lists, cards };
}

/* ------------------------------ 보드 멤버 -------------------------------- */

export function addBoardMember(state, { boardId, memberId } = {}) {
  if (!isStr(memberId)) return state;
  return {
    ...state,
    boards: updateIn(state.boards, boardId, (b) =>
      b.memberIds.includes(memberId) ? b : { ...b, memberIds: [...b.memberIds, memberId] }),
  };
}

export function removeBoardMember(state, { boardId, memberId } = {}) {
  return {
    ...state,
    boards: updateIn(state.boards, boardId, (b) =>
      ({ ...b, memberIds: b.memberIds.filter((m) => m !== memberId) })),
  };
}

/* ------------------------------ 라벨 정의 ------------------------------- */
// 라벨은 **보드 단위 정의**(색+이름)이고, 카드에는 labelId 만 참조로 붙인다(card.js).

export function addLabelDef(state, { boardId, id, name = '', color = 'gray' } = {}) {
  if (!isStr(id) || !state.boards[boardId]) return state;
  return {
    ...state,
    boards: updateIn(state.boards, boardId, (b) =>
      b.labels.some((l) => l.id === id) ? b : { ...b, labels: [...b.labels, { id, name, color }] }),
  };
}

export function updateLabelDef(state, { boardId, id, name, color } = {}) {
  return {
    ...state,
    boards: updateIn(state.boards, boardId, (b) => ({
      ...b,
      labels: b.labels.map((l) => (l.id === id
        ? { ...l, ...(name !== undefined ? { name } : {}), ...(color !== undefined ? { color } : {}) }
        : l)),
    })),
  };
}

/** 라벨 정의 삭제 + 그 보드의 모든 카드에서 해당 labelId 참조 제거(정합성 유지). */
export function removeLabelDef(state, { boardId, id } = {}) {
  const b = state.boards[boardId];
  if (!b) return state;
  const boards = updateIn(state.boards, boardId, (bb) => ({ ...bb, labels: bb.labels.filter((l) => l.id !== id) }));
  const cards = { ...state.cards };
  for (const listId of b.listOrder) {
    const l = state.lists[listId];
    if (!l) continue;
    for (const cid of l.cardOrder) {
      const c = cards[cid];
      if (c && c.labelIds.includes(id)) cards[cid] = { ...c, labelIds: c.labelIds.filter((x) => x !== id) };
    }
  }
  return { ...state, boards, cards };
}

/* --------------------------------- 리스트 -------------------------------- */

export function addList(state, { id, boardId, title, at = 0 } = {}) {
  if (!isStr(id) || !isStr(title) || !state.boards[boardId] || state.lists[id]) return state;
  const list = { id, boardId, title: title.trim(), createdAt: at, archived: false, cardOrder: [] };
  return {
    ...state,
    lists: { ...state.lists, [id]: list },
    boards: updateIn(state.boards, boardId, (b) => ({ ...b, listOrder: [...b.listOrder, id] })),
  };
}

export function renameList(state, { listId, title } = {}) {
  if (!isStr(title)) return state;
  return { ...state, lists: updateIn(state.lists, listId, (l) => ({ ...l, title: title.trim() })) };
}

export function archiveList(state, { listId, archived = true } = {}) {
  return { ...state, lists: updateIn(state.lists, listId, (l) => ({ ...l, archived: !!archived })) };
}

export function deleteList(state, { listId } = {}) {
  const l = state.lists[listId];
  if (!l) return state;
  const cards = { ...state.cards };
  for (const cid of l.cardOrder) delete cards[cid];
  const lists = removeKey(state.lists, listId);
  const boards = updateIn(state.boards, l.boardId, (b) => ({ ...b, listOrder: b.listOrder.filter((x) => x !== listId) }));
  return { ...state, boards, lists, cards };
}

/** 보드 안에서 리스트 순서 이동. toIndex 미지정/범위밖 → 끝/경계로 clamp. */
export function moveList(state, { listId, toIndex } = {}) {
  const l = state.lists[listId];
  if (!l) return state;
  const b = state.boards[l.boardId];
  if (!b) return state;
  const order = b.listOrder.filter((x) => x !== listId);
  const idx = clamp(Number.isInteger(toIndex) ? toIndex : order.length, 0, order.length);
  order.splice(idx, 0, listId);
  return { ...state, boards: updateIn(state.boards, l.boardId, (bb) => ({ ...bb, listOrder: order })) };
}

/* --------------------------------- 카드 ---------------------------------- */

export function addCard(state, { id, listId, title, at = 0 } = {}) {
  if (!isStr(id) || !isStr(title) || !state.lists[listId] || state.cards[id]) return state;
  const card = {
    id, listId, title: title.trim(), desc: '', createdAt: at, archived: false,
    labelIds: [], memberIds: [], due: null, checklists: [], comments: [], attachments: [],
  };
  return {
    ...state,
    cards: { ...state.cards, [id]: card },
    lists: updateIn(state.lists, listId, (l) => ({ ...l, cardOrder: [...l.cardOrder, id] })),
  };
}

export function editCard(state, { cardId, title, desc } = {}) {
  return {
    ...state,
    cards: updateIn(state.cards, cardId, (c) => ({
      ...c,
      ...(isStr(title) ? { title: title.trim() } : {}),
      ...(typeof desc === 'string' ? { desc } : {}),
    })),
  };
}

export function archiveCard(state, { cardId, archived = true } = {}) {
  return { ...state, cards: updateIn(state.cards, cardId, (c) => ({ ...c, archived: !!archived })) };
}

export function deleteCard(state, { cardId } = {}) {
  const c = state.cards[cardId];
  if (!c) return state;
  const cards = removeKey(state.cards, cardId);
  const lists = updateIn(state.lists, c.listId, (l) => ({ ...l, cardOrder: l.cardOrder.filter((x) => x !== cardId) }));
  return { ...state, cards, lists };
}

/**
 * 카드 이동/재정렬. toListId 미지정이면 같은 리스트 안 재정렬, 지정이면 다른 리스트로 이동.
 * toIndex 미지정/범위밖 → 끝/경계로 clamp. 대상 리스트가 없으면 no-op.
 */
export function moveCard(state, { cardId, toListId, toIndex } = {}) {
  const c = state.cards[cardId];
  if (!c) return state;
  const target = toListId ?? c.listId;
  if (!state.lists[target]) return state;

  // 1) 원래 리스트에서 제거
  let lists = updateIn(state.lists, c.listId, (l) => ({ ...l, cardOrder: l.cardOrder.filter((x) => x !== cardId) }));
  // 2) 대상 리스트 order 에 삽입(중복 방지 후 clamp)
  const order = lists[target].cardOrder.filter((x) => x !== cardId);
  const idx = clamp(Number.isInteger(toIndex) ? toIndex : order.length, 0, order.length);
  order.splice(idx, 0, cardId);
  lists = updateIn(lists, target, (l) => ({ ...l, cardOrder: order }));
  // 3) 다른 리스트로 옮겼으면 카드의 listId 갱신
  const cards = target === c.listId ? state.cards : updateIn(state.cards, cardId, (cc) => ({ ...cc, listId: target }));
  return { ...state, lists, cards };
}
