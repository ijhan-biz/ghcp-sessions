# 경험 공유 — 라이트닝 토크 + PL Handoff (완성 예시 · Day2-S7)

## 라이트닝 토크 (5분, 슬라이드 3장)
1. 문제 한 줄: 팀의 일 관리(칸반)를 순수 로직으로 만들어 **테스트로 보장**하고 싶었다.
2. Before/After: "실제 저장까지 다 만들려다 테스트 불가" → **부수효과를 `store`/`engine` 경계로 분리** →
   fake 주입으로 전 기능을 결정론 테스트(43 pass, 0 skip).
3. 나의 솔루션 30초 시연: `npm run demo` → 라벨·마감·체크리스트·통계가 있는 보드가 렌더된다.

## 현업 적용 액션 3개
1. 반복 프롬프트 1개를 Skill/prompt 파일로 표준화 → [`skills/plans-board-skill.md`](../skills/plans-board-skill.md), `.github/prompts/card-slice.prompt.md`
2. 로컬 test + policy-check 를 묶은 최소 게이트 1개 → `npm run gate`
3. PL/리뷰어와 pass/revise/block 기준 30분 합의 → `.github/agents/evaluator.agent.md`

## PL Handoff (1페이지)
| 칸 | 내용 |
| --- | --- |
| 만든 것 | Trello 유형 칸반 엔진(순수 코어 + 주입 경계) + 로컬 게이트 + 커스텀 에이전트 팀 |
| 적용 후보 | 도메인 로직이 "부수효과에 묶여 테스트가 어려운" 팀 기능 |
| 기대 효과 | 부수효과 분리 → 전 기능 결정론 테스트, 회귀 즉시 감지 |
| 필요 지원 | 실제 `store` 어댑터(파일/DB) 승인, 조직 허용 모델/도구 확인 |
| 다음 단계 | D+7 클리닉: 실제 저장 어댑터 1개를 같은 인터페이스로 붙이고 게이트 유지 |
