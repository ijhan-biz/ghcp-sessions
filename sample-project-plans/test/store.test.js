// test/store.test.js
// 저장 경계(주입형 store) — 성공/미주입/실패/부적합 데이터 안전 처리.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState, addBoard, loadState, saveState, memoryStore,
} from '../src/plans.js';

test('save→load 라운드트립(주입 store)', async () => {
  const store = memoryStore();
  let s = addBoard(initialState(), { id: 'b1', title: 'B', at: 1 });
  assert.equal(await saveState(s, { store }), true);
  const loaded = await loadState({ store });
  assert.equal(loaded.boards.b1.title, 'B');
});

test('미주입: load→초기상태, save→false(안전)', async () => {
  assert.deepEqual(await loadState({}), initialState());
  assert.equal(await saveState(initialState(), {}), false);
});

test('실패하는 store 는 안전 처리(throw 안 함)', async () => {
  const boom = {
    load: async () => { throw new Error('io'); },
    save: async () => { throw new Error('io'); },
  };
  assert.deepEqual(await loadState({ store: boom }), initialState());
  assert.equal(await saveState(initialState(), { store: boom }), false);
});

test('부적합 데이터는 초기상태로 폴백', async () => {
  const bad = { load: async () => ({ nope: true }) };
  assert.deepEqual(await loadState({ store: bad }), initialState());
});
