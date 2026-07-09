// src/api.js
// REST 라우터(부수효과 경계) — HTTP 플럼빙과 분리된 순수 디스패치.
//   handleApi(engine, {method, path, query, body}) => Promise<{status, body}>
//   - 입력 검증은 **경계(여기)** 에서 한다(신뢰할 수 없는 입력). 코어는 순수 유지.
//   - 변경(mutation) 성공 시 engine.save() 로 영속화(주입된 store).
//   서버(server.js)는 이 함수를 호출만 하고, 테스트는 http 없이 직접 호출해 검증한다.
import { boardOfCard } from './plans.js';

const json = (status, body) => ({ status, body });
const ok = (body = { ok: true }) => json(200, body);
const created = (id) => (id ? json(201, { ok: true, id }) : json(400, { error: 'create failed' }));
const bad = (msg) => json(400, { error: msg });
const notFound = () => json(404, { error: 'not found' });

const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const intOr = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : undefined; };
const boardOf = (e, card) => boardOfCard(e.state, card);

/** segs 가 pattern 과 맞으면 파라미터 객체, 아니면 null. (':x' 는 캡처) */
function match(segs, pattern) {
  if (segs.length !== pattern.length) return null;
  const params = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p[0] === ':') params[p.slice(1)] = segs[i];
    else if (p !== segs[i]) return null;
  }
  return params;
}

export async function handleApi(engine, { method, path, query = {}, body = {} } = {}) {
  const segs = path.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const result = route(engine, method, segs, body || {}, query);
  if (method !== 'GET' && result.status < 400) {
    await engine.save(); // 주입된 store 로 영속화(미주입이면 false, 무해)
  }
  return result;
}

function route(e, method, segs, body, q) {
  let m;

  /* ------------------------------- boards ------------------------------- */
  if (segs.length === 1 && segs[0] === 'boards') {
    if (method === 'GET') {
      return ok({ boards: e.boards({ includeArchived: true }).map((b) => ({ id: b.id, title: b.title, archived: b.archived })) });
    }
    if (method === 'POST') {
      if (!isNonEmpty(body.title)) return bad('title required');
      return created(e.addBoard(body.title));
    }
  }
  if ((m = match(segs, ['boards', ':id']))) {
    const b = e.board(m.id);
    if (!b) return notFound();
    if (method === 'GET') {
      return ok({ board: e.render(m.id, { now: Date.now() }), stats: e.stats(m.id, { now: Date.now() }) });
    }
    if (method === 'PATCH') {
      if (body.title !== undefined) e.renameBoard(m.id, body.title);
      if (body.archived !== undefined) e.archiveBoard(m.id, !!body.archived);
      return ok();
    }
    if (method === 'DELETE') { e.deleteBoard(m.id); return ok(); }
  }
  if ((m = match(segs, ['boards', ':id', 'copy'])) && method === 'POST') {
    if (!e.board(m.id)) return notFound();
    return created(e.copyBoard(m.id, { title: body.title }));
  }
  if ((m = match(segs, ['boards', ':id', 'members'])) && method === 'POST') {
    if (!e.board(m.id)) return notFound();
    if (!isNonEmpty(body.memberId)) return bad('memberId required');
    e.addBoardMember(m.id, body.memberId.trim()); return ok();
  }
  if ((m = match(segs, ['boards', ':id', 'members', ':mid'])) && method === 'DELETE') {
    if (!e.board(m.id)) return notFound();
    e.removeBoardMember(m.id, m.mid); return ok();
  }
  if ((m = match(segs, ['boards', ':id', 'labels'])) && method === 'POST') {
    if (!e.board(m.id)) return notFound();
    if (!isNonEmpty(body.name) && !isNonEmpty(body.color)) return bad('name or color required');
    return created(e.addLabel(m.id, body.name || '', body.color || 'gray'));
  }
  if ((m = match(segs, ['boards', ':id', 'labels', ':lid']))) {
    if (!e.board(m.id)) return notFound();
    if (method === 'PATCH') { e.updateLabel(m.id, m.lid, { name: body.name, color: body.color }); return ok(); }
    if (method === 'DELETE') { e.removeLabel(m.id, m.lid); return ok(); }
  }
  if ((m = match(segs, ['boards', ':id', 'lists'])) && method === 'POST') {
    if (!e.board(m.id)) return notFound();
    if (!isNonEmpty(body.title)) return bad('title required');
    return created(e.addList(m.id, body.title));
  }
  if ((m = match(segs, ['boards', ':id', 'search'])) && method === 'GET') {
    if (!e.board(m.id)) return notFound();
    const opts = { boardId: m.id, now: Date.now() };
    if (isNonEmpty(q.text)) opts.text = q.text;
    if (isNonEmpty(q.label)) opts.labelIds = [q.label];
    if (isNonEmpty(q.member)) opts.memberIds = [q.member];
    if (isNonEmpty(q.due)) opts.due = q.due;
    return ok({ cards: e.search(opts).map((c) => c.id) });
  }

  /* -------------------------------- lists ------------------------------- */
  if ((m = match(segs, ['lists', ':id']))) {
    if (!e.state.lists[m.id]) return notFound();
    if (method === 'PATCH') {
      if (body.title !== undefined) e.renameList(m.id, body.title);
      if (body.archived !== undefined) e.archiveList(m.id, !!body.archived);
      return ok();
    }
    if (method === 'DELETE') { e.deleteList(m.id); return ok(); }
  }
  if ((m = match(segs, ['lists', ':id', 'move'])) && method === 'POST') {
    if (!e.state.lists[m.id]) return notFound();
    e.moveList(m.id, intOr(body.toIndex)); return ok();
  }
  if ((m = match(segs, ['lists', ':id', 'copy'])) && method === 'POST') {
    if (!e.state.lists[m.id]) return notFound();
    return created(e.copyList(m.id, { title: body.title }));
  }
  if ((m = match(segs, ['lists', ':id', 'cards'])) && method === 'POST') {
    if (!e.state.lists[m.id]) return notFound();
    if (!isNonEmpty(body.title)) return bad('title required');
    return created(e.addCard(m.id, body.title));
  }

  /* -------------------------------- cards ------------------------------- */
  if ((m = match(segs, ['cards', ':id']))) {
    const c = e.state.cards[m.id];
    if (!c) return notFound();
    if (method === 'GET') {
      const b = boardOf(e, c);
      return ok({ card: c, boardLabels: b ? b.labels : [], boardMembers: b ? b.memberIds : [] });
    }
    if (method === 'PATCH') {
      const patch = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.desc !== undefined) patch.desc = body.desc;
      if (Object.keys(patch).length) e.editCard(m.id, patch);
      if (body.archived !== undefined) e.archiveCard(m.id, !!body.archived);
      return ok();
    }
    if (method === 'DELETE') { e.deleteCard(m.id); return ok(); }
  }
  if ((m = match(segs, ['cards', ':id', 'move'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    e.moveCard(m.id, body.toListId, intOr(body.toIndex)); return ok();
  }
  if ((m = match(segs, ['cards', ':id', 'copy'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    return created(e.copyCard(m.id, { toListId: body.toListId, toIndex: intOr(body.toIndex) }));
  }
  if ((m = match(segs, ['cards', ':id', 'labels'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    e.assignLabel(m.id, body.labelId); return ok();
  }
  if ((m = match(segs, ['cards', ':id', 'labels', ':lid'])) && method === 'DELETE') {
    if (!e.state.cards[m.id]) return notFound();
    e.unassignLabel(m.id, m.lid); return ok();
  }
  if ((m = match(segs, ['cards', ':id', 'members'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    e.addCardMember(m.id, body.memberId); return ok();
  }
  if ((m = match(segs, ['cards', ':id', 'members', ':mid'])) && method === 'DELETE') {
    if (!e.state.cards[m.id]) return notFound();
    e.removeCardMember(m.id, m.mid); return ok();
  }
  if ((m = match(segs, ['cards', ':id', 'due']))) {
    if (!e.state.cards[m.id]) return notFound();
    if (method === 'PUT') {
      const at = Number(body.at);
      if (!Number.isFinite(at)) return bad('at (ms) required');
      e.setDue(m.id, at, !!body.done); return ok();
    }
    if (method === 'DELETE') { e.clearDue(m.id); return ok(); }
  }
  if ((m = match(segs, ['cards', ':id', 'due', 'complete'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    e.completeDue(m.id, body.done === undefined ? true : !!body.done); return ok();
  }
  if ((m = match(segs, ['cards', ':id', 'checklists'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    if (!isNonEmpty(body.title)) return bad('title required');
    return created(e.addChecklist(m.id, body.title));
  }
  if ((m = match(segs, ['cards', ':id', 'checklists', ':clid'])) && method === 'DELETE') {
    if (!e.state.cards[m.id]) return notFound();
    e.removeChecklist(m.id, m.clid); return ok();
  }
  if ((m = match(segs, ['cards', ':id', 'checklists', ':clid', 'items'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    if (!isNonEmpty(body.text)) return bad('text required');
    return created(e.addChecklistItem(m.id, m.clid, body.text));
  }
  if ((m = match(segs, ['cards', ':id', 'checklists', ':clid', 'items', ':itid']))) {
    if (!e.state.cards[m.id]) return notFound();
    if (method === 'PATCH') { e.toggleChecklistItem(m.id, m.clid, m.itid, body.done); return ok(); }
    if (method === 'DELETE') { e.removeChecklistItem(m.id, m.clid, m.itid); return ok(); }
  }
  if ((m = match(segs, ['cards', ':id', 'comments'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    if (!isNonEmpty(body.text)) return bad('text required');
    return created(e.addComment(m.id, body.author || '', body.text));
  }
  if ((m = match(segs, ['cards', ':id', 'comments', ':cmid']))) {
    if (!e.state.cards[m.id]) return notFound();
    if (method === 'PATCH') { e.editComment(m.id, m.cmid, body.text); return ok(); }
    if (method === 'DELETE') { e.removeComment(m.id, m.cmid); return ok(); }
  }
  if ((m = match(segs, ['cards', ':id', 'attachments'])) && method === 'POST') {
    if (!e.state.cards[m.id]) return notFound();
    if (!isNonEmpty(body.name)) return bad('name required');
    return created(e.addAttachment(m.id, body.name, body.url || ''));
  }
  if ((m = match(segs, ['cards', ':id', 'attachments', ':aid'])) && method === 'DELETE') {
    if (!e.state.cards[m.id]) return notFound();
    e.removeAttachment(m.id, m.aid); return ok();
  }

  return json(404, { error: 'no route', path: '/' + segs.join('/'), method });
}
