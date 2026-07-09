// test/e2e.test.js
// E2E — 실제 서버를 부팅해 HTTP(fetch)로 전 흐름을 검증한다. 정적 서빙 + 재시작 후 영속화까지.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { createPlansServer } from '../server.js';
import { memoryStore } from '../src/plans.js';
import { fileStore } from '../src/file-store.js';

async function withServer(store, fn) {
  const server = await createPlansServer({ store });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.closeAllConnections?.(); // keep-alive 소켓 즉시 종료(close 지연 방지)
    await new Promise((r) => server.close(r));
  }
}

async function j(base, method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

test('E2E: 정적 index.html 서빙', async () => {
  await withServer(memoryStore(), async (base) => {
    const res = await fetch(base + '/');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    const html = await res.text();
    assert.match(html, /<!doctype html>/i);
  });
});

test('E2E: 보드 전 기능 흐름(HTTP)', async () => {
  await withServer(memoryStore(), async (base) => {
    const b = (await j(base, 'POST', '/api/boards', { title: '제품 로드맵' })).data.id;
    const l1 = (await j(base, 'POST', `/api/boards/${b}/lists`, { title: 'To Do' })).data.id;
    const l2 = (await j(base, 'POST', `/api/boards/${b}/lists`, { title: 'Doing' })).data.id;
    const c = (await j(base, 'POST', `/api/lists/${l1}/cards`, { title: '온보딩 개선' })).data.id;

    const lab = (await j(base, 'POST', `/api/boards/${b}/labels`, { name: '기능', color: 'green' })).data.id;
    await j(base, 'POST', `/api/cards/${c}/labels`, { labelId: lab });
    await j(base, 'POST', `/api/boards/${b}/members`, { memberId: 'alice' });
    await j(base, 'POST', `/api/cards/${c}/members`, { memberId: 'alice' });
    await j(base, 'PUT', `/api/cards/${c}/due`, { at: Date.now() - 86_400_000 }); // 지남
    const cl = (await j(base, 'POST', `/api/cards/${c}/checklists`, { title: '작업' })).data.id;
    const it = (await j(base, 'POST', `/api/cards/${c}/checklists/${cl}/items`, { text: '설계' })).data.id;
    await j(base, 'PATCH', `/api/cards/${c}/checklists/${cl}/items/${it}`, { done: true });
    await j(base, 'POST', `/api/cards/${c}/comments`, { author: 'bob', text: '시안 공유' });
    await j(base, 'POST', `/api/cards/${c}/move`, { toListId: l2, toIndex: 0 });

    const view = (await j(base, 'GET', `/api/boards/${b}`)).data;
    const card = view.board.lists[1].cards[0];
    assert.equal(card.id, c);
    assert.deepEqual(card.labels.map((x) => x.name), ['기능']);
    assert.deepEqual(card.members, ['alice']);
    assert.equal(card.due.overdue, true);
    assert.deepEqual(card.checklist, { done: 1, total: 1, percent: 100 });
    assert.equal(card.comments, 1);
    assert.equal(view.stats.overdue, 1);

    const s = (await j(base, 'GET', `/api/boards/${b}/search?due=overdue`)).data;
    assert.deepEqual(s.cards, [c]);
  });
});

test('E2E: 파일 store 재시작 후 영속화', async () => {
  const dataFile = join(tmpdir(), `plans-e2e-${process.pid}-${Date.now()}.json`);
  try {
    let boardId;
    await withServer(fileStore(dataFile), async (base) => {
      boardId = (await j(base, 'POST', '/api/boards', { title: '유지되는 보드' })).data.id;
      await j(base, 'POST', `/api/boards/${boardId}/lists`, { title: 'L' });
    });
    // 새 서버(같은 파일)로 재시작 → 데이터가 남아 있어야 한다
    await withServer(fileStore(dataFile), async (base) => {
      const { data } = await j(base, 'GET', '/api/boards');
      assert.ok(data.boards.some((x) => x.id === boardId && x.title === '유지되는 보드'));
    });
  } finally {
    await rm(dataFile, { force: true });
  }
});
