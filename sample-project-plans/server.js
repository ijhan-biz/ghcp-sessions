// server.js
// 의존성 0 HTTP 서버(node:http) — 정적 프론트엔드(public/) + JSON REST API(/api/*).
//   엔진은 파일 store 를 주입받아 부팅 시 load, 변경마다 save(부수효과는 경계에만).
//   실행: node server.js   (환경변수 PORT, PLANS_DATA 로 조정)
//   재사용: createPlansServer({ store }) 로 서버 인스턴스를 만들어 테스트에서 fetch 로 E2E 검증.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine } from './src/plans.js';
import { fileStore } from './src/file-store.js';
import { handleApi } from './src/api.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC = join(HERE, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, obj) {
  const buf = Buffer.from(JSON.stringify(obj));
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': buf.length });
  res.end(buf);
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') return resolve({});
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy(); // 1MB 상한(안전)
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

async function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = normalize(join(PUBLIC, rel));
  if (!filePath.startsWith(PUBLIC)) { // 경로 이탈 차단
    res.writeHead(403); res.end('forbidden'); return;
  }
  try {
    const buf = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    // 확장자 없는 경로는 SPA 진입점으로 폴백, 그 외엔 404
    if (!extname(filePath)) {
      try {
        const buf = await readFile(join(PUBLIC, 'index.html'));
        res.writeHead(200, { 'content-type': MIME['.html'] });
        res.end(buf);
        return;
      } catch { /* fall through */ }
    }
    res.writeHead(404); res.end('not found');
  }
}

/** 서버 인스턴스 생성(아직 listen 안 함). store 를 주입해 부팅 시 상태 load. */
export async function createPlansServer({ store } = {}) {
  const engine = createEngine({ store });
  await engine.load();
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
        const body = await readBody(req);
        const query = Object.fromEntries(url.searchParams);
        const result = await handleApi(engine, { method: req.method, path: url.pathname, query, body });
        sendJson(res, result.status, result.body);
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('method not allowed'); return; }
      await serveStatic(res, url.pathname);
    } catch (err) {
      sendJson(res, 500, { error: String((err && err.message) || err) });
    }
  });
}

// 직접 실행 시: 파일 store 로 부팅하고 listen. (심볼릭 링크 경로도 realpath 로 안전 비교)
function isMainModule() {
  if (!process.argv[1]) return false;
  try { return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]); }
  catch { return false; }
}

// 요청 포트가 사용 중이면 다음 포트로 자동 대체 → `npm start` 가 한 번에 뜨도록 보장.
function listenWithFallback(server, desired, maxTries, onReady) {
  let port = desired;
  let attempt = 0;
  const onError = (err) => {
    if (err.code === 'EADDRINUSE' && attempt < maxTries) {
      attempt += 1; port += 1; server.listen(port);
    } else {
      console.error(`✗ 서버 시작 실패: ${err.message}`);
      process.exit(1);
    }
  };
  server.on('error', onError);
  server.listen(port, () => { server.removeListener('error', onError); onReady(port, port !== desired); });
}

if (isMainModule()) {
  const dataFile = process.env.PLANS_DATA || join(HERE, 'data', 'plans.json');
  const desired = Number(process.env.PORT) || 3000;
  const server = await createPlansServer({ store: fileStore(dataFile) });
  listenWithFallback(server, desired, 20, (port, fellBack) => {
    console.log(`✓ Plans 서버 실행 → http://localhost:${port}`);
    if (fellBack) console.log(`  (요청 포트 ${desired} 이(가) 사용 중이라 ${port} 로 대체했습니다. PORT 로 지정 가능)`);
    console.log(`  데이터 파일: ${dataFile}  (Ctrl+C 로 종료)`);
  });
}
