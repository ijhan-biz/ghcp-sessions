// test/api.test.js
// API 라우터(경계) 단위 테스트 — http 없이 handleApi 를 직접 호출해 전 흐름을 검증한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, memoryStore } from '../src/plans.js';
import { handleApi } from '../src/api.js';

const mk = () => createEngine({ store: memoryStore() });
const call = (e, method, path, body, query) => handleApi(e, { method, path, body, query });

test('보드→리스트→카드 생성 흐름 + 렌더', async () => {
  const e = mk();
  const rb = await call(e, 'POST', '/api/boards', { title: 'B' });
  assert.equal(rb.status, 201);
  const b = rb.body.id;

  const rl = await call(e, 'POST', `/api/boards/${b}/lists`, { title: 'To Do' });
  assert.equal(rl.status, 201);
  const l = rl.body.id;

  const rc = await call(e, 'POST', `/api/lists/${l}/cards`, { title: 'C1' });
  assert.equal(rc.status, 201);

  const view = await call(e, 'GET', `/api/boards/${b}`);
  assert.equal(view.status, 200);
  assert.equal(view.body.board.lists.length, 1);
  assert.equal(view.body.board.lists[0].cards[0].title, 'C1');
});

test('라벨·마감·체크리스트·코멘트 흐름', async () => {
  const e = mk();
  const b = (await call(e, 'POST', '/api/boards', { title: 'B' })).body.id;
  const l = (await call(e, 'POST', `/api/boards/${b}/lists`, { title: 'L' })).body.id;
  const c = (await call(e, 'POST', `/api/lists/${l}/cards`, { title: 'C' })).body.id;

  const lab = (await call(e, 'POST', `/api/boards/${b}/labels`, { name: '긴급', color: 'red' })).body.id;
  assert.equal((await call(e, 'POST', `/api/cards/${c}/labels`, { labelId: lab })).status, 200);
  await call(e, 'PUT', `/api/cards/${c}/due`, { at: 1000 });
  const cl = (await call(e, 'POST', `/api/cards/${c}/checklists`, { title: '작업' })).body.id;
  const it = (await call(e, 'POST', `/api/cards/${c}/checklists/${cl}/items`, { text: 'x' })).body.id;
  await call(e, 'PATCH', `/api/cards/${c}/checklists/${cl}/items/${it}`, { done: true });
  await call(e, 'POST', `/api/cards/${c}/comments`, { author: 'a', text: '안녕' });

  const detail = await call(e, 'GET', `/api/cards/${c}`);
  assert.deepEqual(detail.body.card.labelIds, [lab]);
  assert.equal(detail.body.card.due.at, 1000);
  assert.equal(detail.body.card.checklists[0].items[0].done, true);
  assert.equal(detail.body.card.comments[0].text, '안녕');
  assert.equal(detail.body.boardLabels.length, 1); // 피커용 보드 라벨
});

test('카드 이동 + 검색', async () => {
  const e = mk();
  const b = (await call(e, 'POST', '/api/boards', { title: 'B' })).body.id;
  const l1 = (await call(e, 'POST', `/api/boards/${b}/lists`, { title: 'L1' })).body.id;
  const l2 = (await call(e, 'POST', `/api/boards/${b}/lists`, { title: 'L2' })).body.id;
  const c = (await call(e, 'POST', `/api/lists/${l1}/cards`, { title: '로그인 개선' })).body.id;

  assert.equal((await call(e, 'POST', `/api/cards/${c}/move`, { toListId: l2, toIndex: 0 })).status, 200);
  const view = await call(e, 'GET', `/api/boards/${b}`);
  assert.equal(view.body.board.lists[1].cards[0].id, c);

  const s = await call(e, 'GET', `/api/boards/${b}/search`, {}, { text: '로그인' });
  assert.deepEqual(s.body.cards, [c]);
});

test('오류 처리: 404 / 400 / 없는 라우트', async () => {
  const e = mk();
  assert.equal((await call(e, 'GET', '/api/boards/nope')).status, 404);
  assert.equal((await call(e, 'POST', '/api/boards', {})).status, 400);          // title 없음
  assert.equal((await call(e, 'POST', '/api/lists/nope/cards', { title: 'x' })).status, 404);
  assert.equal((await call(e, 'GET', '/api/zzz')).status, 404);                   // 없는 라우트
});
