// test/e2e-trello.test.js
// E2E — 실제 서버를 부팅해 HTTP(fetch)로 **모든 Trello 기능**을 점검한다(기능별 1 테스트).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlansServer } from '../server.js';
import { memoryStore } from '../src/plans.js';

async function withServer(fn) {
  const server = await createPlansServer({ store: memoryStore() });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  try { await fn(base); } finally { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); }
}
async function j(base, method, path, body) {
  const res = await fetch(base + path, {
    method, headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
// 자주 쓰는 조합
async function seedBoardList(base, boardTitle = 'B', listTitle = 'L') {
  const b = (await j(base, 'POST', '/api/boards', { title: boardTitle })).data.id;
  const l = (await j(base, 'POST', `/api/boards/${b}/lists`, { title: listTitle })).data.id;
  return { b, l };
}
const render = async (base, b) => (await j(base, 'GET', `/api/boards/${b}`)).data;
const cardDetail = async (base, c) => (await j(base, 'GET', `/api/cards/${c}`)).data;

/* -------------------------------- 정적 -------------------------------- */
test('정적 자원(index.html·style.css·app.js) 서빙', async () => {
  await withServer(async (base) => {
    for (const [path, re] of [['/', /text\/html/], ['/style.css', /text\/css/], ['/app.js', /javascript/]]) {
      const res = await fetch(base + path);
      assert.equal(res.status, 200, path);
      assert.match(res.headers.get('content-type') || '', re, path);
    }
  });
});

/* -------------------------------- 보드 -------------------------------- */
test('보드: 생성·목록·이름변경·보관/해제·복사·삭제', async () => {
  await withServer(async (base) => {
    const b = (await j(base, 'POST', '/api/boards', { title: '보드A' })).data.id;
    assert.ok(b);
    assert.ok((await j(base, 'GET', '/api/boards')).data.boards.some((x) => x.id === b));
    await j(base, 'PATCH', `/api/boards/${b}`, { title: '보드A2' });
    assert.equal((await render(base, b)).board.title, '보드A2');
    await j(base, 'PATCH', `/api/boards/${b}`, { archived: true });
    assert.equal((await render(base, b)).board.archived, true);
    await j(base, 'PATCH', `/api/boards/${b}`, { archived: false });
    assert.equal((await render(base, b)).board.archived, false);

    const copyId = (await j(base, 'POST', `/api/boards/${b}/copy`, { title: '복제' })).data.id;
    assert.ok(copyId && copyId !== b);
    assert.equal((await render(base, copyId)).board.title, '복제');

    assert.equal((await j(base, 'DELETE', `/api/boards/${b}`)).status, 200);
    assert.equal((await j(base, 'GET', `/api/boards/${b}`)).status, 404);
  });
});

test('보드 멤버: 추가·중복무시·제거', async () => {
  await withServer(async (base) => {
    const b = (await j(base, 'POST', '/api/boards', { title: 'B' })).data.id;
    await j(base, 'POST', `/api/boards/${b}/members`, { memberId: 'alice' });
    await j(base, 'POST', `/api/boards/${b}/members`, { memberId: 'alice' }); // 중복
    assert.deepEqual((await render(base, b)).board.members, ['alice']);
    await j(base, 'DELETE', `/api/boards/${b}/members/alice`);
    assert.deepEqual((await render(base, b)).board.members, []);
  });
});

/* -------------------------------- 리스트 ------------------------------ */
test('리스트: 추가·이름변경·이동(순서)·보관·복사·삭제', async () => {
  await withServer(async (base) => {
    const b = (await j(base, 'POST', '/api/boards', { title: 'B' })).data.id;
    const l1 = (await j(base, 'POST', `/api/boards/${b}/lists`, { title: 'L1' })).data.id;
    const l2 = (await j(base, 'POST', `/api/boards/${b}/lists`, { title: 'L2' })).data.id;
    assert.deepEqual((await render(base, b)).board.lists.map((l) => l.id), [l1, l2]);

    await j(base, 'PATCH', `/api/lists/${l1}`, { title: 'L1x' });
    assert.equal((await render(base, b)).board.lists[0].title, 'L1x');

    await j(base, 'POST', `/api/lists/${l2}/move`, { toIndex: 0 });
    assert.deepEqual((await render(base, b)).board.lists.map((l) => l.id), [l2, l1]);

    await j(base, 'POST', `/api/lists/${l1}/cards`, { title: 'c' });
    const copyId = (await j(base, 'POST', `/api/lists/${l1}/copy`, {})).data.id;
    assert.ok(copyId);
    assert.equal((await render(base, b)).board.lists.length, 3);

    await j(base, 'PATCH', `/api/lists/${l1}`, { archived: true });
    assert.equal((await render(base, b)).board.lists.some((l) => l.id === l1), false); // 기본 렌더 제외
    await j(base, 'DELETE', `/api/lists/${l2}`);
    assert.equal((await render(base, b)).board.lists.some((l) => l.id === l2), false);
  });
});

/* -------------------------------- 카드 -------------------------------- */
test('카드: 추가·수정·리스트내 재정렬·리스트간 이동·보관/해제·복사·삭제', async () => {
  await withServer(async (base) => {
    const b = (await j(base, 'POST', '/api/boards', { title: 'B' })).data.id;
    const l1 = (await j(base, 'POST', `/api/boards/${b}/lists`, { title: 'L1' })).data.id;
    const l2 = (await j(base, 'POST', `/api/boards/${b}/lists`, { title: 'L2' })).data.id;
    const c1 = (await j(base, 'POST', `/api/lists/${l1}/cards`, { title: 'A' })).data.id;
    const c2 = (await j(base, 'POST', `/api/lists/${l1}/cards`, { title: 'B' })).data.id;
    const c3 = (await j(base, 'POST', `/api/lists/${l1}/cards`, { title: 'C' })).data.id;

    await j(base, 'PATCH', `/api/cards/${c1}`, { title: 'A2', desc: '설명' });
    const d = await cardDetail(base, c1);
    assert.equal(d.card.title, 'A2'); assert.equal(d.card.desc, '설명');

    await j(base, 'POST', `/api/cards/${c3}/move`, { toListId: l1, toIndex: 0 }); // 같은 리스트 재정렬
    assert.deepEqual((await render(base, b)).board.lists[0].cards.map((c) => c.id), [c3, c1, c2]);

    await j(base, 'POST', `/api/cards/${c1}/move`, { toListId: l2, toIndex: 0 }); // 리스트간 이동
    const v = await render(base, b);
    assert.deepEqual(v.board.lists[0].cards.map((c) => c.id), [c3, c2]);
    assert.deepEqual(v.board.lists[1].cards.map((c) => c.id), [c1]);

    await j(base, 'PATCH', `/api/cards/${c2}`, { archived: true });
    assert.equal((await render(base, b)).board.lists[0].cards.some((c) => c.id === c2), false);
    await j(base, 'PATCH', `/api/cards/${c2}`, { archived: false });
    assert.equal((await render(base, b)).board.lists[0].cards.some((c) => c.id === c2), true);

    const copyId = (await j(base, 'POST', `/api/cards/${c3}/copy`, {})).data.id;
    assert.ok(copyId && copyId !== c3);

    await j(base, 'DELETE', `/api/cards/${c3}`);
    assert.equal((await j(base, 'GET', `/api/cards/${c3}`)).status, 404);
  });
});

/* -------------------------------- 라벨 -------------------------------- */
test('라벨: 생성·수정·배정·해제·필터·삭제(참조 정리)', async () => {
  await withServer(async (base) => {
    const { b, l } = await seedBoardList(base);
    const c1 = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c1' })).data.id;
    const c2 = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c2' })).data.id;
    const lab = (await j(base, 'POST', `/api/boards/${b}/labels`, { name: '긴급', color: 'red' })).data.id;

    await j(base, 'PATCH', `/api/boards/${b}/labels/${lab}`, { name: '중요' });
    assert.equal((await render(base, b)).board.labels[0].name, '중요');

    await j(base, 'POST', `/api/cards/${c1}/labels`, { labelId: lab });
    assert.deepEqual((await cardDetail(base, c1)).card.labelIds, [lab]);
    assert.deepEqual((await j(base, 'GET', `/api/boards/${b}/search?label=${lab}`)).data.cards, [c1]);

    await j(base, 'DELETE', `/api/cards/${c1}/labels/${lab}`);
    assert.deepEqual((await cardDetail(base, c1)).card.labelIds, []);

    await j(base, 'POST', `/api/cards/${c2}/labels`, { labelId: lab });
    await j(base, 'DELETE', `/api/boards/${b}/labels/${lab}`); // 정의 삭제 → 카드 참조도 정리
    assert.deepEqual((await cardDetail(base, c2)).card.labelIds, []);
    assert.equal((await render(base, b)).board.labels.length, 0);
  });
});

/* ------------------------------ 카드 멤버 ----------------------------- */
test('카드 멤버: 보드 멤버만 배정, 필터, 비멤버 거부', async () => {
  await withServer(async (base) => {
    const { b, l } = await seedBoardList(base);
    const c = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c' })).data.id;
    await j(base, 'POST', `/api/boards/${b}/members`, { memberId: 'alice' });

    await j(base, 'POST', `/api/cards/${c}/members`, { memberId: 'alice' });
    assert.deepEqual((await cardDetail(base, c)).card.memberIds, ['alice']);
    await j(base, 'POST', `/api/cards/${c}/members`, { memberId: 'bob' }); // 보드 멤버 아님 → 무시
    assert.deepEqual((await cardDetail(base, c)).card.memberIds, ['alice']);

    assert.deepEqual((await j(base, 'GET', `/api/boards/${b}/search?member=alice`)).data.cards, [c]);
    await j(base, 'DELETE', `/api/cards/${c}/members/alice`);
    assert.deepEqual((await cardDetail(base, c)).card.memberIds, []);
  });
});

/* -------------------------------- 마감 -------------------------------- */
test('마감: 설정·overdue 필터·완료·해제', async () => {
  await withServer(async (base) => {
    const { b, l } = await seedBoardList(base);
    const c = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c' })).data.id;
    const past = Date.now() - 86_400_000;

    await j(base, 'PUT', `/api/cards/${c}/due`, { at: past });
    assert.equal((await cardDetail(base, c)).card.due.at, past);
    assert.deepEqual((await j(base, 'GET', `/api/boards/${b}/search?due=overdue`)).data.cards, [c]);

    await j(base, 'POST', `/api/cards/${c}/due/complete`, { done: true });
    assert.equal((await cardDetail(base, c)).card.due.done, true);
    assert.deepEqual((await j(base, 'GET', `/api/boards/${b}/search?due=overdue`)).data.cards, []);

    await j(base, 'DELETE', `/api/cards/${c}/due`);
    assert.equal((await cardDetail(base, c)).card.due, null);
  });
});

/* ------------------------------ 체크리스트 ---------------------------- */
test('체크리스트: 추가·항목·토글·진행률·삭제', async () => {
  await withServer(async (base) => {
    const { b, l } = await seedBoardList(base);
    const c = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c' })).data.id;
    const cl = (await j(base, 'POST', `/api/cards/${c}/checklists`, { title: '작업' })).data.id;
    const i1 = (await j(base, 'POST', `/api/cards/${c}/checklists/${cl}/items`, { text: 'a' })).data.id;
    await j(base, 'POST', `/api/cards/${c}/checklists/${cl}/items`, { text: 'b' });

    await j(base, 'PATCH', `/api/cards/${c}/checklists/${cl}/items/${i1}`, { done: true });
    const card = (await render(base, b)).board.lists[0].cards[0];
    assert.deepEqual(card.checklist, { done: 1, total: 2, percent: 50 });

    await j(base, 'DELETE', `/api/cards/${c}/checklists/${cl}/items/${i1}`);
    assert.equal((await cardDetail(base, c)).card.checklists[0].items.length, 1);
    await j(base, 'DELETE', `/api/cards/${c}/checklists/${cl}`);
    assert.equal((await cardDetail(base, c)).card.checklists.length, 0);
  });
});

/* -------------------------- 코멘트 · 첨부 ----------------------------- */
test('코멘트: 추가·수정·삭제', async () => {
  await withServer(async (base) => {
    const { l } = await seedBoardList(base);
    const c = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c' })).data.id;
    const id = (await j(base, 'POST', `/api/cards/${c}/comments`, { author: 'a', text: '안녕' })).data.id;
    assert.equal((await cardDetail(base, c)).card.comments[0].text, '안녕');
    await j(base, 'PATCH', `/api/cards/${c}/comments/${id}`, { text: '수정' });
    assert.equal((await cardDetail(base, c)).card.comments[0].text, '수정');
    await j(base, 'DELETE', `/api/cards/${c}/comments/${id}`);
    assert.equal((await cardDetail(base, c)).card.comments.length, 0);
  });
});

test('첨부(메타): 추가·삭제', async () => {
  await withServer(async (base) => {
    const { l } = await seedBoardList(base);
    const c = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c' })).data.id;
    const id = (await j(base, 'POST', `/api/cards/${c}/attachments`, { name: 'spec.pdf', url: 'https://x/s.pdf' })).data.id;
    assert.equal((await cardDetail(base, c)).card.attachments[0].name, 'spec.pdf');
    await j(base, 'DELETE', `/api/cards/${c}/attachments/${id}`);
    assert.equal((await cardDetail(base, c)).card.attachments.length, 0);
  });
});

/* ---------------------------- 검색 · 통계 ----------------------------- */
test('검색 결합(text+label) & 통계(overdue)', async () => {
  await withServer(async (base) => {
    const { b, l } = await seedBoardList(base);
    const lab = (await j(base, 'POST', `/api/boards/${b}/labels`, { name: 'x', color: 'red' })).data.id;
    const c1 = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: '로그인 개선' })).data.id;
    const c2 = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: '로그인 버그' })).data.id;
    await j(base, 'POST', `/api/cards/${c1}/labels`, { labelId: lab });
    await j(base, 'PUT', `/api/cards/${c2}/due`, { at: Date.now() - 1000 });

    assert.deepEqual((await j(base, 'GET', `/api/boards/${b}/search?text=로그인&label=${lab}`)).data.cards, [c1]);
    assert.equal((await render(base, b)).stats.overdue, 1);
  });
});

/* -------------------------------- 오류 -------------------------------- */
test('오류 처리: 404 / 400 / 없는 라우트', async () => {
  await withServer(async (base) => {
    assert.equal((await j(base, 'GET', '/api/boards/nope')).status, 404);
    assert.equal((await j(base, 'POST', '/api/boards', {})).status, 400);
    assert.equal((await j(base, 'POST', '/api/lists/nope/cards', { title: 'x' })).status, 404);
    const { l } = await seedBoardList(base);
    const c = (await j(base, 'POST', `/api/lists/${l}/cards`, { title: 'c' })).data.id;
    assert.equal((await j(base, 'PUT', `/api/cards/${c}/due`, {})).status, 400); // at 없음
    assert.equal((await j(base, 'GET', '/api/zzz')).status, 404);
  });
});
