// src/query.js
// 조회(순수 셀렉터) — 읽기 전용. 보관(archived) 항목은 기본 제외, 옵션으로 포함.
//   시간에 의존하는 조회(마감/overdue)는 now(ms)를 **명시 인자**로 받아 결정론을 지킨다.

import { isStr, boardOfCard } from './state.js';

/* ------------------------------ 기본 셀렉터 ------------------------------ */

export const getBoard = (state, boardId) => state.boards[boardId];
export const getList = (state, listId) => state.lists[listId];
export const getCard = (state, cardId) => state.cards[cardId];

/** 보드 목록(생성순). includeArchived=false 면 보관 보드 제외. */
export function boards(state, { includeArchived = false } = {}) {
  return Object.values(state.boards)
    .filter((b) => includeArchived || !b.archived)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

/** 보드의 리스트들(listOrder 순). */
export function listsOf(state, boardId, { includeArchived = false } = {}) {
  const b = state.boards[boardId];
  if (!b) return [];
  return b.listOrder
    .map((id) => state.lists[id])
    .filter(Boolean)
    .filter((l) => includeArchived || !l.archived);
}

/** 리스트의 카드들(cardOrder 순). */
export function cardsOf(state, listId, { includeArchived = false } = {}) {
  const l = state.lists[listId];
  if (!l) return [];
  return l.cardOrder
    .map((id) => state.cards[id])
    .filter(Boolean)
    .filter((c) => includeArchived || !c.archived);
}

/* ------------------------------ 파생 계산 -------------------------------- */

/** 카드의 체크리스트 진행률 { done, total, percent }. 항목 0개면 0%. */
export function checklistProgress(card) {
  const items = (card?.checklists || []).flatMap((cl) => cl.items);
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** 마감이 지났고 아직 완료 안 됐는가. */
export function isOverdue(card, now) {
  return !!(card?.due && !card.due.done && Number.isFinite(card.due.at) && card.due.at < now);
}

/** 카드의 보드 id (없으면 undefined). */
export const boardIdOfCard = (state, card) => boardOfCard(state, card)?.id;

/* -------------------------------- 검색 ----------------------------------- */
// 필터를 AND 로 결합: text(제목+설명 부분일치) · labelIds(모두 포함) · memberIds(모두 포함) ·
//   due('none'|'set'|'overdue'|'complete'). boardId 로 특정 보드에 한정 가능.

export function search(state, {
  boardId, text, labelIds, memberIds, due, includeArchived = false, now = Date.now(),
} = {}) {
  let cards = Object.values(state.cards);
  if (boardId) cards = cards.filter((c) => boardIdOfCard(state, c) === boardId);
  if (!includeArchived) cards = cards.filter((c) => !c.archived);

  if (isStr(text)) {
    const q = text.trim().toLowerCase();
    cards = cards.filter((c) => `${c.title} ${c.desc}`.toLowerCase().includes(q));
  }
  if (Array.isArray(labelIds) && labelIds.length) {
    cards = cards.filter((c) => labelIds.every((id) => c.labelIds.includes(id)));
  }
  if (Array.isArray(memberIds) && memberIds.length) {
    cards = cards.filter((c) => memberIds.every((id) => c.memberIds.includes(id)));
  }
  if (due === 'none') cards = cards.filter((c) => !c.due);
  else if (due === 'set') cards = cards.filter((c) => !!c.due);
  else if (due === 'overdue') cards = cards.filter((c) => isOverdue(c, now));
  else if (due === 'complete') cards = cards.filter((c) => !!c.due && c.due.done);

  return cards;
}

/* -------------------------------- 통계 ----------------------------------- */

/** 보드 요약 통계 — 리스트별 카드 수, 총/보관/마감초과 수, 체크리스트 롤업. */
export function boardStats(state, boardId, { now = Date.now() } = {}) {
  const b = state.boards[boardId];
  if (!b) return null;
  const lists = listsOf(state, boardId).map((l) => ({
    id: l.id,
    title: l.title,
    count: cardsOf(state, l.id).length,
  }));
  const active = [];
  let archived = 0;
  for (const listId of b.listOrder) {
    const l = state.lists[listId];
    if (!l) continue;
    for (const cid of l.cardOrder) {
      const c = state.cards[cid];
      if (!c) continue;
      if (c.archived) archived += 1;
      else active.push(c);
    }
  }
  const overdue = active.filter((c) => isOverdue(c, now)).length;
  const roll = active.reduce((acc, c) => {
    const p = checklistProgress(c);
    acc.done += p.done; acc.total += p.total;
    return acc;
  }, { done: 0, total: 0 });
  return {
    boardId,
    lists,
    total: active.length,
    archived,
    overdue,
    checklist: { done: roll.done, total: roll.total, percent: roll.total === 0 ? 0 : Math.round((roll.done / roll.total) * 100) },
  };
}

/* --------------------------- 보드 렌더(뷰 모델) --------------------------- */
// 화면/직렬화용 **평면 뷰**. 라벨 id 를 실제 {id,name,color} 로 풀고, 카드에는 요약 지표만 담는다.

export function renderBoard(state, boardId, { includeArchived = false, now = Date.now() } = {}) {
  const b = state.boards[boardId];
  if (!b) return null;
  const labelById = Object.fromEntries(b.labels.map((l) => [l.id, l]));
  return {
    id: b.id,
    title: b.title,
    archived: b.archived,
    members: [...b.memberIds],
    labels: b.labels.map((l) => ({ ...l })),
    lists: listsOf(state, boardId, { includeArchived }).map((l) => ({
      id: l.id,
      title: l.title,
      archived: l.archived,
      cards: cardsOf(state, l.id, { includeArchived }).map((c) => ({
        id: c.id,
        title: c.title,
        desc: c.desc,
        labels: c.labelIds.map((id) => labelById[id]).filter(Boolean),
        members: [...c.memberIds],
        due: c.due ? { ...c.due, overdue: isOverdue(c, now) } : null,
        checklist: checklistProgress(c),
        comments: c.comments.length,
        attachments: c.attachments.length,
        archived: c.archived,
      })),
    })),
  };
}
