// src/insight.js
// 키워드 인사이트 생성 — 기본은 로컬 결정론 요약(LLM 비사용), env 토큰이 있으면 GitHub Models(OpenAI 호환)로 업그레이드.
//
// 가드레일 준수:
//   - 외부 npm 패키지 0. 토큰/엔드포인트는 env로만 주입, 없으면 로컬 요약만 사용(외부 호출 없음).
//   - localInsight 는 순수·결정론 함수라 테스트가 네트워크 없이 검증 가능.

/** 수집 결과와 트렌드로부터 결정론적 로컬 인사이트를 만든다(LLM 미사용). */
export function localInsight(query, trends = [], posts = [], segments = {}) {
  const collected = Array.isArray(posts) ? posts.length : 0;
  const label = query ? `"${query}"` : '전체';
  if (collected === 0) {
    return { summary: `${label} 관련 수집 결과가 없습니다.`, bullets: [], source: 'local' };
  }
  const bullets = [];
  if (trends.length) {
    const total = trends.reduce((s, t) => s + t.score, 0) || 1;
    const top = trends[0];
    const share = Math.round((top.score / total) * 100);
    bullets.push(`가장 뜨는 태그는 #${top.tag} (점수 ${top.score.toFixed(1)}, 전체의 ${share}%).`);
    const next = trends.slice(1, 3).map((t) => `#${t.tag}`).join(', ');
    if (next) bullets.push(`뒤를 잇는 태그: ${next}.`);
    const mostMentioned = [...trends].sort((a, b) => b.count - a.count)[0];
    bullets.push(`언급이 가장 많은 태그는 #${mostMentioned.tag} (${mostMentioned.count}회).`);
  } else {
    bullets.push('해시태그 기반 트렌드는 감지되지 않았습니다(웹 문서 위주 결과).');
  }
  const regionLine = segmentHighlight(segments.byRegion);
  if (regionLine) bullets.push(`지역별 1위 키워드 — ${regionLine}.`);
  const ageLine = segmentHighlight(segments.byAge);
  if (ageLine) bullets.push(`연령대별 1위 키워드 — ${ageLine}.`);
  bullets.push(`총 ${collected}건을 분석했습니다.`);
  return { summary: `${label} 트렌드 요약`, bullets, source: 'local' };
}

/** 세그먼트별 1위 태그를 "세그먼트:#태그" 형태로 요약한다. */
function segmentHighlight(segment) {
  if (!segment) return '';
  return Object.entries(segment)
    .map(([key, list]) => (list && list[0] ? `${key} #${list[0].tag}` : null))
    .filter(Boolean)
    .slice(0, 5)
    .join(', ');
}

/**
 * 인사이트 생성: env 토큰이 주입되면 GitHub Copilot(GitHub Models) LLM 사용, 아니면 로컬 요약으로 폴백.
 * @param {{fetch?:Function, token?:string, endpoint?:string, model?:string, segments?:object}} deps
 */
export async function generateInsight(query, trends = [], posts = [], deps = {}) {
  const { fetch = globalThis.fetch, token, endpoint, model = 'gpt-4o-mini', segments = {} } = deps;
  if (typeof fetch === 'function' && token && endpoint) {
    try {
      const text = await callLLM({ fetch, token, endpoint, model, prompt: buildPrompt(query, trends, posts, segments) });
      const bullets = splitBullets(text);
      if (bullets.length) {
        return { summary: `${query ? `"${query}"` : '전체'} 인사이트 (GitHub Copilot)`, bullets, source: 'llm' };
      }
    } catch {
      // 실패 시 로컬 요약으로 안전 폴백
    }
  }
  return localInsight(query, trends, posts, segments);
}

function buildPrompt(query, trends, posts, segments = {}) {
  const tagLines = (trends || []).slice(0, 8)
    .map((t, i) => `${i + 1}. #${t.tag} (score ${t.score.toFixed(2)}, ${t.count} mentions)`).join('\n');
  const sample = (posts || []).slice(0, 8)
    .map((p) => `- ${String(p?.text ?? '').slice(0, 140)}`).join('\n');
  const seg = [
    segments.byRegion ? `지역별: ${segmentHighlight(segments.byRegion)}` : '',
    segments.byAge ? `연령대별: ${segmentHighlight(segments.byAge)}` : '',
  ].filter(Boolean).join('\n');
  return [
    `키워드 "${query || '(전체)'}"에 대한 SNS/웹 트렌드 분석 데이터입니다.`,
    '', '상위 태그:', tagLines || '(없음)',
    seg ? '\n세그먼트 요약:\n' + seg : '',
    '', '수집 샘플:', sample || '(없음)',
    '', "위 데이터를 바탕으로 한국어로 3~5개의 간결한 인사이트를 제시하세요. 지역·연령대 차이가 있으면 짚어주세요. 각 줄은 '- '로 시작.",
  ].join('\n');
}

async function callLLM({ fetch, token, endpoint, model, prompt }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res || !res.ok) return '';
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

function splitBullets(text) {
  return String(text ?? '')
    .split('\n')
    .map((s) => s.replace(/^[\s\-*•\d.]+/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}
