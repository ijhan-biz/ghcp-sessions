// src/keywordDetails.js
// 키워드(해시태그)별 "주요 내용" 상세 설명 생성 — 순수·결정론 함수(외부 호출 없음).
//   - 해당 태그를 포함한 게시물을 모아 규모·관심도·최신성·연관 태그·대표 게시물을 분석해
//     여러 줄의 상세 설명(explanation)과 통계(stats)를 만든다.
import { extractHashtags, engagement, recencyWeight } from './trends.js';

/** 한 태그의 상세 설명을 만든다. */
export function explainKeyword(posts, tag, { now = Date.now(), maxSamples = 3 } = {}) {
  const tagLower = String(tag ?? '').toLowerCase();
  const list = Array.isArray(posts) ? posts : [];
  const matched = list.filter((p) => new Set(extractHashtags(p?.text)).has(tagLower));
  if (matched.length === 0) {
    return {
      tag: tagLower, count: 0, share: 0, samples: [], related: [], keywords: [],
      segments: { byRegion: [], byAge: [] },
      stats: { totalEngagement: 0, avgEngagement: 0, maxEngagement: 0 },
      recency: { newestDaysAgo: null, oldestDaysAgo: null },
      context: `#${tagLower} 관련 게시물이 없어 맥락을 파악할 수 없습니다.`,
      summary: `#${tagLower} 관련 게시물이 없습니다.`,
      explanation: [`#${tagLower} 관련 게시물이 없습니다.`],
    };
  }
  // 대표 게시물: (1+engagement)×recencyWeight 내림차순
  const weight = (p) => (1 + engagement(p)) * recencyWeight(p, now);
  const ranked = [...matched].sort((a, b) => weight(b) - weight(a));
  const samples = ranked.slice(0, maxSamples).map((p) => String(p.text).trim());
  const sampleDetails = ranked.slice(0, maxSamples).map((p) => ({ text: String(p.text).trim(), engagement: engagement(p) }));
  const related = topRelatedTags(matched, tagLower);
  const keywords = contentKeywords(matched, tagLower);
  const regionDist = segmentDist(matched, 'region');
  const ageDist = segmentDist(matched, 'ageGroup');

  const share = Math.round((matched.length / list.length) * 100);
  const engagements = matched.map((p) => engagement(p));
  const totalEngagement = engagements.reduce((s, v) => s + v, 0);
  const avgEngagement = Math.round((totalEngagement / matched.length) * 10) / 10;
  const maxEngagement = Math.max(...engagements);
  const daysList = matched.map((p) => daysAgo(p, now)).filter((d) => d != null);
  const newestDaysAgo = daysList.length ? Math.min(...daysList) : null;
  const oldestDaysAgo = daysList.length ? Math.max(...daysList) : null;

  const stats = { totalEngagement, avgEngagement, maxEngagement };
  const recency = { newestDaysAgo, oldestDaysAgo };
  const context = buildContext(tagLower, related, keywords, sampleDetails);
  const summary = buildSummary(tagLower, matched.length, related);
  const explanation = buildExplanation({
    tag: tagLower, count: matched.length, total: list.length, share,
    stats, recency, related, keywords, regionDist, ageDist, sampleDetails, context,
  });
  return {
    tag: tagLower, count: matched.length, share, samples, related, keywords,
    segments: { byRegion: regionDist, byAge: ageDist }, stats, recency, context, summary, explanation,
  };
}

/** 여러 트렌드 태그 각각의 설명을 태그→설명 맵으로 반환한다. */
export function explainTrends(posts, trends, opts = {}) {
  const out = {};
  for (const t of Array.isArray(trends) ? trends : []) {
    out[t.tag] = explainKeyword(posts, t.tag, opts);
  }
  return out;
}

/** 같은 게시물에 함께 등장한 다른 해시태그 빈도 상위 N. */
function topRelatedTags(matched, tagLower, limit = 3) {
  const counts = new Map();
  for (const p of matched) {
    for (const other of new Set(extractHashtags(p?.text))) {
      if (other === tagLower) continue;
      counts.set(other, (counts.get(other) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([t, c]) => ({ tag: t, count: c }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

function daysAgo(post, now) {
  const created = post?.createdAt;
  const t = typeof created === 'number' ? created : Date.parse(created);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((now - t) / 86_400_000));
}

const STOPWORDS = new Set([
  // 한국어
  '그리고', '정말', '너무', '오늘', '주말', '관련', '내용', '하는', '있는', '에서', '으로',
  '합니다', '했다', '좋아', '좋았지', '옛날', '기록', '어렵지만', '재밌다',
  // 영어(실데이터 대비 흔한 불용어)
  'the', 'and', 'for', 'with', 'this', 'that', 'you', 'are', 'was', 'were', 'have', 'has',
  'had', 'not', 'but', 'because', 'from', 'they', 'them', 'their', 'our', 'your', 'his', 'her',
  'she', 'him', 'its', 'about', 'into', 'out', 'off', 'over', 'under', 'then', 'than', 'too',
  'can', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'been', 'being', 'get',
  'got', 'just', 'like', 'want', 'need', 'here', 'there', 'what', 'when', 'where', 'who', 'why',
  'how', 'all', 'any', 'some', 'more', 'most', 'such', 'only', 'own', 'same', 'other', 'new',
  'now', 'one', 'two', 'also', 'via', 'per', 'yet', 'don', 'isn', 'aren', 'let',
  'to', 'of', 'is', 'in', 'on', 'it', 'be', 'or', 'an', 'as', 'at', 'we', 'us', 'my', 'me',
  'do', 'if', 'no', 'up', 'by', 'so', 'am', 're', 've', 'll', 'im', 'us', 'he', 'i', 'a',
]);

/** 매칭 게시물 본문에서 해시태그를 제외한 핵심 내용어(빈도 상위)를 뽑는다. */
function contentKeywords(matched, tagLower, limit = 5) {
  const counts = new Map();
  for (const p of matched) {
    const text = String(p?.text ?? '').replace(/#[0-9A-Za-z_\uAC00-\uD7A3]+/g, ' ');
    for (const raw of text.split(/[^0-9A-Za-z\uAC00-\uD7A3]+/)) {
      const w = raw.trim();
      if (w.length < 2) continue;
      if (/^\d+$/.test(w)) continue;
      const key = w.toLowerCase();
      if (key === tagLower || STOPWORDS.has(key)) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/** 지정 필드(region/ageGroup) 기준 언급 분포 상위 N. */
function segmentDist(matched, field, limit = 3) {
  const counts = new Map();
  for (const p of matched) {
    const v = p?.[field];
    if (v == null || v === '') continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)))
    .slice(0, limit);
}

function buildSummary(tag, count, related) {
  const relText = related.length
    ? `주로 ${related.map((r) => `#${r.tag}`).join(', ')}와(과) 함께 언급됩니다`
    : '주로 단독으로 언급됩니다';
  return `#${tag}는 ${count}건에서 등장하며 ${relText}.`;
}

/** 태그가 어떤 맥락에서 쓰이는지를 연관 태그·핵심 내용어로 한 문장 설명한다(검색 결과 기반). */
function buildContext(tag, related, keywords, sampleDetails) {
  const rel = related.slice(0, 3).map((r) => `#${r.tag}`).join(', ');
  const kw = keywords.slice(0, 3).map((k) => k.word).join(', ');
  if (rel && kw) return `#${tag}는 ${rel} 등과 함께 '${kw}' 맥락에서 주로 사용됩니다.`;
  if (rel) return `#${tag}는 주로 ${rel} 등과 함께 사용됩니다.`;
  if (kw) return `#${tag}는 '${kw}' 맥락에서 주로 사용됩니다.`;
  const snippet = sampleDetails[0] ? sampleDetails[0].text.slice(0, 40) : '';
  return snippet ? `#${tag}는 예: "${snippet}" 같은 글에서 사용됩니다.` : `#${tag}의 맥락 정보가 충분하지 않습니다.`;
}

/** 맥락·규모·관심도·최신성·핵심어·언급층·연관·대표 게시물을 여러 줄의 상세 설명으로 만든다. */
function buildExplanation({ tag, count, total, share, stats, recency, related, keywords, regionDist, ageDist, sampleDetails, context }) {
  const lines = [];
  if (context) lines.push(`맥락: ${context}`);
  lines.push(`규모: 전체 ${total}건 중 ${count}건(${share}%)에서 #${tag}가 언급됐습니다.`);
  lines.push(`관심도: 총 engagement ${stats.totalEngagement}, 평균 ${stats.avgEngagement}, 최고 ${stats.maxEngagement}.`);
  if (recency.newestDaysAgo != null) {
    const span = recency.newestDaysAgo === recency.oldestDaysAgo
      ? `${recency.newestDaysAgo}일 전 집중`
      : `${recency.newestDaysAgo}일 전 ~ ${recency.oldestDaysAgo}일 전`;
    lines.push(`최신성: 최근 언급은 ${recency.newestDaysAgo}일 전이며 분포는 ${span}입니다.`);
  }
  if (keywords.length) {
    lines.push(`핵심 내용어: ${keywords.map((k) => `${k.word}(${k.count})`).join(', ')}.`);
  }
  const regionText = regionDist.length ? `지역 ${regionDist.map((r) => `${r.key}(${r.count})`).join(', ')}` : '';
  const ageText = ageDist.length ? `연령 ${ageDist.map((a) => `${a.key}(${a.count})`).join(', ')}` : '';
  const audience = [regionText, ageText].filter(Boolean).join(' · ');
  if (audience) lines.push(`주 언급층: ${audience}.`);
  lines.push(related.length
    ? `연관 키워드: ${related.map((r) => `#${r.tag}(${r.count}회)`).join(', ')}.`
    : '연관 키워드: 없음(주로 단독 언급).');
  if (sampleDetails.length) {
    lines.push(`대표 게시물: ${sampleDetails.map((s) => `"${s.text}"(engagement ${s.engagement})`).join(' · ')}.`);
  }
  return lines;
}
