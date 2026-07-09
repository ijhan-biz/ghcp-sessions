// public/app.js — Plans 칸반 SPA (vanilla JS, 빌드 없음). REST API(/api/*)와 통신.
'use strict';

/* ------------------------------- 유틸 -------------------------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const pad = (n) => String(n).padStart(2, '0');

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const COLORS = { red: '#eb5a46', orange: '#ff9f1a', yellow: '#f2d600', green: '#61bd4f', lime: '#51e898', blue: '#0079bf', sky: '#00c2e0', purple: '#c377e0', pink: '#ff78cb', gray: '#b3bac5' };
const colorHex = (c) => COLORS[c] || c || COLORS.gray;
const initials = (name) => (name || '?').trim().slice(0, 2);
// Enter 확정키만 true. 한글 IME 조합 중 Enter(keyCode 229 / isComposing)는 무시 → 중복 제출 방지.
const isEnter = (e) => e.key === 'Enter' && !e.isComposing && e.keyCode !== 229;

async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { toast(data.error || `오류 ${res.status}`); throw new Error(data.error || res.status); }
  return data;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

function toLocalInput(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fmtDue = (ms) => { const d = new Date(ms); return `${d.getMonth() + 1}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ------------------------------- 상태 -------------------------------- */
const state = { boards: [], currentBoardId: null, board: null, stats: null, filter: { text: '', due: '' }, searchIds: null };
let pendingFocus = null; // { type:'card'|'list', listId }

/* ----------------------------- 보드 목록 ----------------------------- */
async function loadBoards() {
  const { boards } = await api('GET', '/boards');
  state.boards = boards;
  renderSidebar();
}

function renderSidebar() {
  const ul = $('#boardList');
  ul.replaceChildren(...state.boards.map((b) => h('li', {
    class: `${b.id === state.currentBoardId ? 'active' : ''} ${b.archived ? 'archived' : ''}`,
    onclick: () => openBoard(b.id),
  }, h('span', { class: 'dot' }), h('span', {}, b.title || '(제목 없음)'))));
}

/* ------------------------------- 보드 -------------------------------- */
async function openBoard(id) {
  state.currentBoardId = id;
  state.filter = { text: '', due: '' };
  $('#search').value = '';
  $('#dueFilter').value = '';
  await refreshBoard();
}

async function refreshBoard() {
  if (!state.currentBoardId) return;
  const { board, stats } = await api('GET', '/boards/' + state.currentBoardId);
  state.board = board;
  state.stats = stats;
  await applySearch();
  renderBoard();
  renderSidebar();
}

async function applySearch() {
  const { text, due } = state.filter;
  if (!text && !due) { state.searchIds = null; return; }
  const qs = new URLSearchParams();
  if (text) qs.set('text', text);
  if (due) qs.set('due', due);
  const { cards } = await api('GET', `/boards/${state.currentBoardId}/search?${qs}`);
  state.searchIds = new Set(cards);
}

function renderBoard() {
  const board = state.board;
  const titleEl = $('#boardTitle');
  for (const id of ['membersBtn', 'labelsBtn', 'archiveBoardBtn']) $('#' + id).hidden = !board;
  if (!board) { titleEl.textContent = '보드를 선택하세요'; $('#board').replaceChildren(h('div', { class: 'empty' }, '왼쪽에서 보드를 만들거나 선택하세요.')); return; }
  titleEl.textContent = board.title;
  $('#archiveBoardBtn').textContent = board.archived ? '보관 해제' : '보관';

  const cols = board.lists.map(listEl);
  cols.push(addListColumn());
  $('#board').replaceChildren(...cols);

  if (pendingFocus) {
    const sel = pendingFocus.type === 'list' ? '.add-list input' : `.list[data-list-id="${pendingFocus.listId}"] .composer input`;
    const inp = $(sel);
    if (inp) inp.focus();
    pendingFocus = null;
  }
}

/* ------------------------------- 리스트 ------------------------------ */
function listEl(list) {
  const cards = list.cards
    .filter((c) => !state.searchIds || state.searchIds.has(c.id))
    .map((c) => cardEl(c, list));

  const cardsUl = h('ul', { class: 'cards', dataset: { listId: list.id } }, ...cards);
  wireDropzone(cardsUl);

  const titleEl = h('div', { class: 'list-title', title: '더블클릭하여 이름 변경', ondblclick: () => editListTitle(titleEl, list) }, list.title);

  const composerInput = h('input', { type: 'text', placeholder: '+ 카드 추가', onkeydown: (e) => { if (isEnter(e)) addCard(list.id, e.target.value, e.target); } });

  return h('div', { class: `list ${list.archived ? 'archived' : ''}`, dataset: { listId: list.id } },
    h('div', { class: 'list-head' },
      titleEl,
      h('span', { class: 'list-count' }, String(list.cards.length)),
      h('button', { class: 'icon-btn', title: '왼쪽으로', onclick: () => moveList(list.id, -1) }, '◀'),
      h('button', { class: 'icon-btn', title: '오른쪽으로', onclick: () => moveList(list.id, +1) }, '▶'),
      h('button', { class: 'icon-btn', title: '복사', onclick: () => copyList(list.id) }, '⧉'),
      h('button', { class: 'icon-btn', title: list.archived ? '보관 해제' : '보관', onclick: () => archiveList(list.id, !list.archived) }, '🗄'),
      h('button', { class: 'icon-btn', title: '삭제', onclick: (e) => delList(e.target, list.id) }, '🗑'),
    ),
    cardsUl,
    h('div', { class: 'composer' }, composerInput),
  );
}

function addListColumn() {
  const input = h('input', { type: 'text', placeholder: '+ 리스트 제목', onkeydown: (e) => { if (isEnter(e)) addList(e.target.value, e.target); } });
  return h('div', { class: 'add-list' }, h('div', { class: 'add-list-form' }, h('div', { class: 'composer' }, input)));
}

async function addList(title, inputEl) {
  const t = title.trim();
  if (!t) return;
  if (inputEl) inputEl.value = ''; // 즉시 비워 중복 제출 방지
  await api('POST', `/boards/${state.currentBoardId}/lists`, { title: t });
  pendingFocus = { type: 'list' };
  await refreshBoard();
}
async function editListTitle(el, list) {
  const input = h('input', { type: 'text', value: list.title, class: 'list-title' });
  el.replaceWith(input);
  input.focus(); input.select();
  let finished = false;
  const commit = async () => {
    if (finished) return; finished = true;
    const v = input.value.trim();
    if (v && v !== list.title) { await api('PATCH', `/lists/${list.id}`, { title: v }); }
    await refreshBoard();
  };
  input.addEventListener('keydown', (e) => { if (isEnter(e)) input.blur(); if (e.key === 'Escape') { finished = true; refreshBoard(); } });
  input.addEventListener('blur', commit, { once: true });
}
async function moveList(listId, dir) {
  const order = state.board.lists.map((l) => l.id);
  const idx = order.indexOf(listId);
  const to = idx + dir;
  if (to < 0 || to >= order.length) return;
  await api('POST', `/lists/${listId}/move`, { toIndex: to });
  await refreshBoard();
}
async function copyList(listId) { await api('POST', `/lists/${listId}/copy`, {}); toast('리스트 복사됨'); await refreshBoard(); }
async function archiveList(listId, archived) { await api('PATCH', `/lists/${listId}`, { archived }); await refreshBoard(); }
async function delList(anchor, listId) { if (await confirmPop(anchor, '이 리스트와 카드들을 삭제할까요?')) { await api('DELETE', `/lists/${listId}`); await refreshBoard(); } }

/* -------------------------------- 카드 ------------------------------- */
function cardEl(card, list) {
  const labels = h('div', { class: 'labels' }, ...card.labels.map((l) => h('span', { class: 'chip', style: `background:${colorHex(l.color)}`, title: l.name })));
  const badges = [];
  if (card.due) {
    const cls = card.due.done ? 'done' : (card.due.overdue ? 'overdue' : '');
    badges.push(h('span', { class: `badge due ${cls}` }, (card.due.done ? '✓ ' : '⏰ ') + fmtDue(card.due.at)));
  }
  if (card.checklist.total) badges.push(h('span', { class: 'badge' }, `☑ ${card.checklist.done}/${card.checklist.total}`));
  if (card.comments) badges.push(h('span', { class: 'badge' }, `💬 ${card.comments}`));
  if (card.attachments) badges.push(h('span', { class: 'badge' }, `📎 ${card.attachments}`));
  const members = h('span', { class: 'members' }, ...card.members.map((m) => h('span', { class: 'avatar', title: m }, initials(m))));
  if (card.members.length) badges.push(members);

  const el = h('li', {
    class: 'card', draggable: 'true', dataset: { cardId: card.id },
    onclick: () => openCard(card.id),
  },
    card.labels.length ? labels : null,
    h('div', { class: 'title' }, card.title),
    badges.length ? h('div', { class: 'badges' }, ...badges) : null,
  );
  el.addEventListener('dragstart', (e) => { el.classList.add('dragging'); e.dataTransfer.setData('text/plain', card.id); e.dataTransfer.effectAllowed = 'move'; });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  return el;
}

function wireDropzone(container) {
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = $('.card.dragging');
    if (!dragging) return;
    const after = getDragAfterElement(container, e.clientY);
    if (after == null) container.appendChild(dragging);
    else container.insertBefore(dragging, after);
  });
  container.addEventListener('drop', async (e) => {
    e.preventDefault();
    const dragging = $('.card.dragging');
    if (!dragging) return;
    const cardId = dragging.dataset.cardId;
    const toListId = container.dataset.listId;
    const toIndex = [...container.querySelectorAll('.card')].indexOf(dragging);
    dragging.classList.remove('dragging');
    await api('POST', `/cards/${cardId}/move`, { toListId, toIndex });
    await refreshBoard();
  });
}
function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.card:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

async function addCard(listId, title, inputEl) {
  const t = title.trim();
  if (!t) return;
  if (inputEl) inputEl.value = ''; // 즉시 비워 중복 제출 방지
  await api('POST', `/lists/${listId}/cards`, { title: t });
  pendingFocus = { type: 'card', listId };
  await refreshBoard();
}

/* ------------------------------ 카드 모달 ---------------------------- */
const modalRoot = document.getElementById('modalRoot');
let boardDirty = false;

function closeModal() {
  modalRoot.replaceChildren();
  if (boardDirty) { boardDirty = false; refreshBoard(); }
}

async function openCard(cardId) {
  const detail = await api('GET', '/cards/' + cardId);
  renderModal(cardId, detail);
}
async function reopen(cardId) { boardDirty = true; await openCard(cardId); }

function renderModal(cardId, { card, boardLabels, boardMembers }) {
  const bid = state.currentBoardId;

  // 제목
  const titleInput = h('input', { type: 'text', class: 'title-input', value: card.title });
  titleInput.addEventListener('change', async () => { await api('PATCH', `/cards/${cardId}`, { title: titleInput.value }); boardDirty = true; toast('제목 저장'); });

  // 설명
  const desc = h('textarea', { placeholder: '설명을 추가하세요…' }, card.desc || '');
  const saveDesc = h('button', { class: 'add', onclick: async () => { await api('PATCH', `/cards/${cardId}`, { desc: desc.value }); boardDirty = true; toast('설명 저장'); } }, '저장');

  // 라벨 (보드 라벨 토글 + 새 라벨)
  const labelPills = boardLabels.map((l) => {
    const on = card.labelIds.includes(l.id);
    return h('button', { class: `pill ${on ? 'on' : ''}`, style: `background:${colorHex(l.color)}`, onclick: async () => {
      if (on) await api('DELETE', `/cards/${cardId}/labels/${l.id}`);
      else await api('POST', `/cards/${cardId}/labels`, { labelId: l.id });
      await reopen(cardId);
    } }, l.name || l.color);
  });
  const newLabel = h('button', { class: 'pill plain', onclick: (e) => newLabelPop(e.target, bid, cardId) }, '+ 새 라벨');

  // 멤버
  const memberPills = boardMembers.map((m) => {
    const on = card.memberIds.includes(m);
    return h('button', { class: `pill plain ${on ? 'on' : ''}`, onclick: async () => {
      if (on) await api('DELETE', `/cards/${cardId}/members/${m}`);
      else await api('POST', `/cards/${cardId}/members`, { memberId: m });
      await reopen(cardId);
    } }, `${on ? '✓ ' : ''}${m}`);
  });
  const addMember = h('button', { class: 'pill plain', onclick: (e) => addBoardMemberPop(e.target, bid, () => reopen(cardId)) }, '+ 멤버');

  // 마감
  const dueInput = h('input', { type: 'datetime-local', value: card.due ? toLocalInput(card.due.at) : '' });
  const dueSet = h('button', { class: 'add', onclick: async () => { const v = dueInput.value; if (!v) return; await api('PUT', `/cards/${cardId}/due`, { at: new Date(v).getTime() }); await reopen(cardId); } }, '설정');
  const dueControls = [dueInput, dueSet];
  if (card.due) {
    dueControls.push(h('label', { class: 'meta' }, h('input', { type: 'checkbox', checked: card.due.done, onchange: async (e) => { await api('POST', `/cards/${cardId}/due/complete`, { done: e.target.checked }); await reopen(cardId); } }), ' 완료'));
    dueControls.push(h('button', { class: 'side-btn danger', style: 'width:auto;display:inline-block;margin:0', onclick: async () => { await api('DELETE', `/cards/${cardId}/due`); await reopen(cardId); } }, '제거'));
  }

  // 체크리스트
  const checklistSections = card.checklists.map((cl) => {
    const done = cl.items.filter((i) => i.done).length;
    const pct = cl.items.length ? Math.round((done / cl.items.length) * 100) : 0;
    const items = cl.items.map((it) => h('li', { class: it.done ? 'done' : '' },
      h('input', { type: 'checkbox', checked: it.done, onchange: async () => { await api('PATCH', `/cards/${cardId}/checklists/${cl.id}/items/${it.id}`, { done: !it.done }); await reopen(cardId); } }),
      h('label', {}, it.text),
      h('button', { class: 'icon-btn', onclick: async () => { await api('DELETE', `/cards/${cardId}/checklists/${cl.id}/items/${it.id}`); await reopen(cardId); } }, '×'),
    ));
    const itemInput = h('input', { type: 'text', placeholder: '+ 항목 추가' });
    const addItem = async () => { if (!itemInput.value.trim()) return; await api('POST', `/cards/${cardId}/checklists/${cl.id}/items`, { text: itemInput.value }); await reopen(cardId); };
    itemInput.addEventListener('keydown', (e) => { if (isEnter(e)) addItem(); });
    return h('div', { class: 'section' },
      h('h3', {}, cl.title, ' ', h('button', { class: 'icon-btn', title: '체크리스트 삭제', onclick: async () => { await api('DELETE', `/cards/${cardId}/checklists/${cl.id}`); await reopen(cardId); } }, '🗑')),
      h('div', { class: 'progress' }, h('div', { style: `width:${pct}%` })),
      h('ul', { class: 'check-list' }, ...items),
      h('div', { class: 'inline-form' }, itemInput, h('button', { onclick: addItem }, '추가')),
    );
  });
  const newChecklistInput = h('input', { type: 'text', placeholder: '체크리스트 제목' });
  const addChecklist = async () => { if (!newChecklistInput.value.trim()) return; await api('POST', `/cards/${cardId}/checklists`, { title: newChecklistInput.value }); await reopen(cardId); };
  newChecklistInput.addEventListener('keydown', (e) => { if (isEnter(e)) addChecklist(); });

  // 코멘트
  const commentList = card.comments.map((cm) => h('div', { class: 'comment' },
    h('div', { class: 'who' }, cm.author || '익명'),
    h('div', {}, cm.text),
    h('button', { class: 'icon-btn', onclick: async () => { await api('DELETE', `/cards/${cardId}/comments/${cm.id}`); await reopen(cardId); } }, '삭제'),
  ));
  const cAuthor = h('input', { type: 'text', placeholder: '이름', style: 'max-width:90px' });
  const cText = h('input', { type: 'text', placeholder: '코멘트 추가…' });
  const addComment = async () => { if (!cText.value.trim()) return; await api('POST', `/cards/${cardId}/comments`, { author: cAuthor.value, text: cText.value }); await reopen(cardId); };
  cText.addEventListener('keydown', (e) => { if (isEnter(e)) addComment(); });

  // 첨부(메타)
  const attachList = card.attachments.map((a) => h('div', { class: 'attach' },
    a.url ? h('a', { href: a.url, target: '_blank', rel: 'noopener' }, a.name) : h('span', {}, a.name),
    h('button', { class: 'icon-btn', onclick: async () => { await api('DELETE', `/cards/${cardId}/attachments/${a.id}`); await reopen(cardId); } }, '삭제'),
  ));
  const aName = h('input', { type: 'text', placeholder: '이름', style: 'max-width:110px' });
  const aUrl = h('input', { type: 'text', placeholder: 'https://… (선택)' });
  const addAttach = async () => { if (!aName.value.trim()) return; await api('POST', `/cards/${cardId}/attachments`, { name: aName.value, url: aUrl.value }); await reopen(cardId); };

  const modal = h('div', { class: 'modal' },
    h('button', { class: 'modal-close', title: '닫기', onclick: closeModal }, '×'),
    titleInput,
    h('div', { class: 'sub' }, `카드 ID ${cardId}`),
    h('div', { class: 'row' },
      h('div', { class: 'col-main' },
        h('div', { class: 'section' }, h('h3', {}, '라벨'), h('div', { class: 'pill-row' }, ...labelPills, newLabel)),
        h('div', { class: 'section' }, h('h3', {}, '멤버'), h('div', { class: 'pill-row' }, ...memberPills, addMember)),
        h('div', { class: 'section' }, h('h3', {}, '마감'), h('div', { class: 'inline-form' }, ...dueControls)),
        h('div', { class: 'section' }, h('h3', {}, '설명'), desc, h('div', { class: 'inline-form' }, saveDesc)),
        ...checklistSections,
        h('div', { class: 'section' }, h('h3', {}, '체크리스트 추가'), h('div', { class: 'inline-form' }, newChecklistInput, h('button', { onclick: addChecklist }, '추가'))),
        h('div', { class: 'section' }, h('h3', {}, '코멘트'), ...commentList, h('div', { class: 'inline-form' }, cAuthor, cText, h('button', { onclick: addComment }, '추가'))),
        h('div', { class: 'section' }, h('h3', {}, '첨부'), ...attachList, h('div', { class: 'inline-form' }, aName, aUrl, h('button', { onclick: addAttach }, '추가'))),
      ),
      h('div', { class: 'col-side' },
        h('h3', {}, '동작'),
        h('button', { class: 'side-btn', onclick: async () => { await api('POST', `/cards/${cardId}/copy`, {}); toast('카드 복사됨'); boardDirty = true; closeModal(); } }, '⧉ 복사'),
        h('button', { class: 'side-btn', onclick: async () => { await api('PATCH', `/cards/${cardId}`, { archived: !card.archived }); boardDirty = true; closeModal(); } }, card.archived ? '📤 보관 해제' : '🗄 보관'),
        h('button', { class: 'side-btn danger', onclick: async (e) => { if (await confirmPop(e.target, '이 카드를 삭제할까요?')) { await api('DELETE', `/cards/${cardId}`); boardDirty = true; closeModal(); } } }, '🗑 삭제'),
      ),
    ),
  );

  const overlay = h('div', { class: 'overlay', onclick: (e) => { if (e.target === overlay) closeModal(); } }, modal);
  modalRoot.replaceChildren(overlay);
}

/* ------------------------------ 팝오버 ------------------------------- */
const popRoot = document.getElementById('popRoot');
function closePop() { popRoot.replaceChildren(); document.removeEventListener('click', onDocClick, true); }
function onDocClick(e) { if (!e.target.closest('.pop') && !popRoot.contains(e.target)) closePop(); }
function openPop(anchor, node) {
  closePop();
  const pop = h('div', { class: 'pop' }, node);
  popRoot.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.top = Math.min(r.bottom + 6, window.innerHeight - pop.offsetHeight - 8) + 'px';
  pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
  setTimeout(() => document.addEventListener('click', onDocClick, true), 0);
  return pop;
}
function confirmPop(anchor, msg) {
  return new Promise((resolve) => {
    const yes = h('button', { class: 'side-btn danger', onclick: () => { closePop(); resolve(true); } }, '확인');
    const no = h('button', { class: 'side-btn', onclick: () => { closePop(); resolve(false); } }, '취소');
    openPop(anchor, h('div', {}, h('h4', {}, msg), yes, no));
  });
}
function newLabelPop(anchor, boardId, cardId) {
  const name = h('input', { type: 'text', placeholder: '라벨 이름' });
  const color = h('select', {}, ...Object.keys(COLORS).map((c) => h('option', { value: c }, c)));
  const create = h('button', { class: 'add', style: 'margin-top:8px', onclick: async () => {
    const { id } = await api('POST', `/boards/${boardId}/labels`, { name: name.value, color: color.value });
    if (id) await api('POST', `/cards/${cardId}/labels`, { labelId: id });
    closePop(); await reopen(cardId);
  } }, '만들고 적용');
  openPop(anchor, h('div', {}, h('h4', {}, '새 라벨'), name, h('div', { style: 'height:6px' }), color, create));
}
function addBoardMemberPop(anchor, boardId, after) {
  const name = h('input', { type: 'text', placeholder: '멤버 ID (예: alice)' });
  const add = h('button', { class: 'add', style: 'margin-top:8px', onclick: async () => { if (!name.value.trim()) return; await api('POST', `/boards/${boardId}/members`, { memberId: name.value }); closePop(); if (after) await after(); } }, '추가');
  name.addEventListener('keydown', (e) => { if (isEnter(e)) add.click(); });
  openPop(anchor, h('div', {}, h('h4', {}, '보드 멤버 추가'), name, add));
}

/* -------------------- 보드 레벨: 멤버/라벨 팝오버 -------------------- */
function boardMembersPop(anchor) {
  const b = state.board;
  const rows = (b.members || []).map((m) => h('div', { class: 'list-row' },
    h('span', { class: 'avatar' }, initials(m)), h('span', { style: 'flex:1' }, m),
    h('button', { class: 'icon-btn', onclick: async () => { await api('DELETE', `/boards/${b.id}/members/${m}`); closePop(); await refreshBoard(); boardMembersPop(anchor); } }, '×'),
  ));
  const name = h('input', { type: 'text', placeholder: '멤버 ID 추가' });
  const add = h('button', { class: 'add', style: 'margin-top:8px', onclick: async () => { if (!name.value.trim()) return; await api('POST', `/boards/${b.id}/members`, { memberId: name.value }); closePop(); await refreshBoard(); boardMembersPop(anchor); } }, '추가');
  name.addEventListener('keydown', (e) => { if (isEnter(e)) add.click(); });
  openPop(anchor, h('div', {}, h('h4', {}, '보드 멤버'), ...(rows.length ? rows : [h('div', { class: 'meta' }, '아직 없음')]), name, add));
}
function boardLabelsPop(anchor) {
  const b = state.board;
  const rows = (b.labels || []).map((l) => h('div', { class: 'list-row' },
    h('span', { class: 'swatch', style: `background:${colorHex(l.color)}` }), h('span', { style: 'flex:1' }, l.name || l.color),
    h('button', { class: 'icon-btn', onclick: async () => { await api('DELETE', `/boards/${b.id}/labels/${l.id}`); closePop(); await refreshBoard(); boardLabelsPop(anchor); } }, '×'),
  ));
  const name = h('input', { type: 'text', placeholder: '라벨 이름' });
  const color = h('select', {}, ...Object.keys(COLORS).map((c) => h('option', { value: c }, c)));
  const add = h('button', { class: 'add', style: 'margin-top:8px', onclick: async () => { await api('POST', `/boards/${b.id}/labels`, { name: name.value, color: color.value }); closePop(); await refreshBoard(); boardLabelsPop(anchor); } }, '추가');
  openPop(anchor, h('div', {}, h('h4', {}, '보드 라벨'), ...(rows.length ? rows : [h('div', { class: 'meta' }, '아직 없음')]), name, h('div', { style: 'height:6px' }), color, add));
}

/* ----------------------------- 초기 배선 ---------------------------- */
function editBoardTitle() {
  if (!state.board) return;
  const el = $('#boardTitle');
  if (!el || el.tagName === 'INPUT') return;
  const input = h('input', { type: 'text', value: state.board.title, style: 'font-size:16px;padding:6px;border-radius:6px;border:0' });
  el.replaceWith(input);
  input.focus(); input.select();
  let finished = false;
  const restore = () => {
    const h1 = h('h1', { id: 'boardTitle', title: '더블클릭하여 이름 변경' }, state.board ? state.board.title : '');
    h1.addEventListener('dblclick', editBoardTitle);
    if (input.isConnected) input.replaceWith(h1);
  };
  const commit = async () => {
    if (finished) return; finished = true;
    const v = input.value.trim();
    restore();
    if (v && v !== state.board.title) { await api('PATCH', `/boards/${state.board.id}`, { title: v }); await refreshBoard(); }
  };
  input.addEventListener('keydown', (e) => { if (isEnter(e)) input.blur(); if (e.key === 'Escape') { finished = true; restore(); } });
  input.addEventListener('blur', commit, { once: true });
}

function newBoardInline() {
  const ul = $('#boardList');
  const input = h('input', { type: 'text', placeholder: '보드 제목 후 Enter', style: 'width:100%;padding:6px;border-radius:6px;border:0' });
  const li = h('li', {}, input);
  ul.prepend(li);
  input.focus();
  let finished = false;
  input.addEventListener('keydown', async (e) => {
    if (isEnter(e) && input.value.trim()) {
      if (finished) return; finished = true;
      const { id } = await api('POST', '/boards', { title: input.value });
      await loadBoards();
      if (id) openBoard(id);
    } else if (e.key === 'Escape') { finished = true; renderSidebar(); }
  });
  input.addEventListener('blur', () => { if (!finished) { finished = true; renderSidebar(); } }, { once: true });
}

function wire() {
  $('#newBoardBtn').addEventListener('click', newBoardInline);
  $('#boardTitle').addEventListener('dblclick', editBoardTitle);
  $('#membersBtn').addEventListener('click', (e) => boardMembersPop(e.target));
  $('#labelsBtn').addEventListener('click', (e) => boardLabelsPop(e.target));
  $('#archiveBoardBtn').addEventListener('click', async () => { await api('PATCH', `/boards/${state.board.id}`, { archived: !state.board.archived }); await loadBoards(); await refreshBoard(); });
  let searchTimer;
  $('#search').addEventListener('input', (e) => { clearTimeout(searchTimer); searchTimer = setTimeout(async () => { state.filter.text = e.target.value.trim(); await applySearch(); renderBoard(); }, 200); });
  $('#dueFilter').addEventListener('change', async (e) => { state.filter.due = e.target.value; await applySearch(); renderBoard(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (modalRoot.firstChild) closeModal(); else closePop(); } });
}

async function boot() {
  wire();
  await loadBoards();
  if (state.boards.length) openBoard(state.boards[0].id);
  else renderBoard();
}
boot();
