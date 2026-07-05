// src/sampleData.js
// 데모용 내장 샘플 게시물(비식별·secret 없음). 서버·CLI가 공유한다.
// 각 게시물에 region(지역)·ageGroup(연령대) 메타데이터를 부여해 세그먼트 분석을 지원한다.
// createdAt은 호출 시점 기준 상대일이라 최근성 가중이 실시간으로 반영된다.

const rel = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

/** 실행 시점 기준으로 계산된 샘플 게시물 목록을 반환한다(모두 이번 주 = 최근 6일 이내). */
export function getSamplePosts() {
  return [
    { text: '신제품 발표 #ai 최고 #tech', likes: 10, reposts: 2, createdAt: rel(0), region: '서울', ageGroup: '20대' },
    { text: '#ai 어렵지만 재밌다 #study', likes: 4, reposts: 1, createdAt: rel(0), region: '서울', ageGroup: '10대' },
    { text: '#tech 트렌드 정리 #ai', likes: 8, reposts: 3, createdAt: rel(1), region: '부산', ageGroup: '30대' },
    { text: '요즘 #tech 컨퍼런스 후기', likes: 40, reposts: 15, createdAt: rel(5), region: '부산', ageGroup: '40대+' },
    { text: '주말 #daily 기록 #study', likes: 2, reposts: 0, createdAt: rel(2), region: '대구', ageGroup: '20대' },
    { text: '#kpop 콘서트 후기 #daily', likes: 30, reposts: 12, createdAt: rel(0), region: '서울', ageGroup: '10대' },
    { text: '#부동산 시장 #경제 분석', likes: 15, reposts: 5, createdAt: rel(1), region: '서울', ageGroup: '40대+' },
    { text: '#ai 스타트업 채용 #tech', likes: 20, reposts: 8, createdAt: rel(0), region: '경기', ageGroup: '30대' },
    { text: '#kpop 신곡 #ai 커버', likes: 25, reposts: 10, createdAt: rel(0), region: '부산', ageGroup: '10대' },
    { text: '#여행 #daily 부산 여행', likes: 12, reposts: 3, createdAt: rel(3), region: '부산', ageGroup: '20대' },
    { text: '#경제 금리 뉴스 #부동산', likes: 9, reposts: 2, createdAt: rel(1), region: '경기', ageGroup: '40대+' },
    { text: '#study 취업 준비 #ai', likes: 6, reposts: 1, createdAt: rel(0), region: '대구', ageGroup: '20대' },
    { text: '#게임 신작 #ai NPC 화제', likes: 33, reposts: 14, createdAt: rel(2), region: '서울', ageGroup: '10대' },
    { text: '#kpop 컴백 #게임 콜라보', likes: 28, reposts: 9, createdAt: rel(1), region: '경기', ageGroup: '20대' },
    { text: '#여행 제주 맛집 #daily', likes: 18, reposts: 4, createdAt: rel(4), region: '대구', ageGroup: '30대' },
    { text: '#tech 리뷰 #게임 그래픽', likes: 22, reposts: 7, createdAt: rel(3), region: '서울', ageGroup: '30대' },
    { text: '#경제 부업 #study 후기', likes: 11, reposts: 2, createdAt: rel(2), region: '부산', ageGroup: '20대' },
    { text: '#부동산 전세 #경제 팁', likes: 14, reposts: 3, createdAt: rel(5), region: '경기', ageGroup: '40대+' },
  ];
}

/** 쿼리 부분일치로 게시물을 돌려주는 내장 fake fetcher를 만든다. */
export function createSampleFetcher() {
  return async (q) => getSamplePosts().filter((p) => q === '' || p.text.includes(q));
}
