// src/state.js
// Plans 보드 엔진 — 상태 모양(정규화) + 불변 갱신 헬퍼.
//
// 설계 결정(중요):
//   - 상태는 **정규화된 평면 맵**(boards / lists / cards)으로 둔다. 카드 이동·재정렬이
//     order 배열 splice 로 결정론적으로 끝나고, 깊은 중첩 갱신을 피할 수 있다.
//   - 모든 변경 함수는 **순수(pure)** 하다. 같은 입력 → 같은 새 상태(입력을 변형하지 않음).
//   - id 생성·시간·영속화 같은 **부수효과는 경계 밖**(engine.js / store.js)으로 분리한다.
//     순수 코어는 id 와 시각(at)을 **명시적 인자로만** 받는다(테스트 결정론).
//
// 상태 모양:
//   State = { boards:{[id]:Board}, lists:{[id]:List}, cards:{[id]:Card} }
//   Board = { id, title, createdAt, archived, memberIds:[], labels:[{id,name,color}], listOrder:[listId] }
//   List  = { id, boardId, title, createdAt, archived, cardOrder:[cardId] }
//   Card  = { id, listId, title, desc, createdAt, archived, labelIds:[], memberIds:[],
//             due:{at,done}|null, checklists:[{id,title,items:[{id,text,done}]}],
//             comments:[{id,author,text,at}], attachments:[{id,name,url,at}] }

/** 빈 초기 상태. */
export function initialState() {
  return { boards: {}, lists: {}, cards: {} };
}

/** 문자열이며 공백만은 아닌지. (title/id 등 필수 문자열 검증) */
export const isStr = (s) => typeof s === 'string' && s.trim().length > 0;

/** n 을 [lo, hi] 로 자른다. (이동 인덱스 경계 처리) */
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** map[id] 를 updater(cur) 결과로 교체한 **새 map**. id 없으면 원본 map 그대로. */
export function updateIn(map, id, updater) {
  const cur = map[id];
  if (!cur) return map;
  return { ...map, [id]: updater(cur) };
}

/** map 에서 id 키를 제거한 **새 map**. 없으면 원본 그대로. */
export function removeKey(map, id) {
  if (!(id in map)) return map;
  const next = { ...map };
  delete next[id];
  return next;
}

/** 카드가 속한 List (없으면 undefined). */
export function listOfCard(state, card) {
  return card ? state.lists[card.listId] : undefined;
}

/** 카드가 속한 Board (없으면 undefined). list → board 로 두 단계. */
export function boardOfCard(state, card) {
  const l = listOfCard(state, card);
  return l ? state.boards[l.boardId] : undefined;
}

/** load 로 들어온 데이터가 상태 모양을 갖췄는지(얕은 검증). */
export function isValidState(s) {
  return !!s
    && typeof s === 'object'
    && s.boards && typeof s.boards === 'object'
    && s.lists && typeof s.lists === 'object'
    && s.cards && typeof s.cards === 'object';
}
