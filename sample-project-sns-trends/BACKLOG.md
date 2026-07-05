# BACKLOG — 유명 SNS 트렌드 분석 엔진

> 2일 과정에서 **slice 1개**를 골라 진행합니다(권장 #1). 각 slice는 1~2개 파일에서 test-first로 구현 가능합니다.

| # | Slice | 설명 | AC(정상·예외·경계) | 대상 파일 |
| --- | --- | --- | --- | --- |
| **1** ⭐ | **최근성 가중(recencyWeight)** | 오래된 글의 태그 점수를 반감기 7일로 감쇠 | 최근 글 우선 / 시각 없으면 감쇠 없음 / 7일=0.5배 | `src/trends.js`, `test/trends.test.js` |
| 2 | 불용 태그(stopword) 제외 | 흔한 잡음 태그(#일상 등) 제외 | 목록 제외 / 빈 목록 무영향 / 대소문자 무시 | `src/trends.js` |
| 3 | 최소 언급 수 필터 | count < k 태그는 랭킹 제외 | k 미만 제외 / k=0 전체 / 경계 count=k | `src/trends.js` |
| 4 | 급상승 지표 | 전일 대비 증가율로 "급상승" 표시 | 증가=상승 / 신규 태그 처리 / 0→N 경계 | `src/trends.js` |

## 진행 순서
- **Day1**: `FEATURE-SPEC.md` 채택 → User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
- **Day2**: 하네스·게이트(S1~S3) → test-first 로 `test/trends.test.js` 의 `skip` 해제 → `src/trends.js` 의 `recencyWeight` 구현(S4~S5) → Custom Skill/Agent(S6) → 공유(S7)
- 정답 비교: `src/trends.solution.js`
