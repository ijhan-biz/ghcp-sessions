# 슬라이스 백로그 — 하나만 골라 2일 진행

각 slice는 **1~2개 파일에서 test-first 로 끝낼 수 있는 얇은 단위**입니다.

| # | slice | 난이도 | 무엇을 |
| --- | --- | --- | --- |
| 1 | 집중 세션 분리(sessionize) | ★ (권장 시작) | 유휴 간격 초과 시 세션 분리(`idleGapMs` 이하면 같은 세션). `test/activity.test.js` skip 2개 해제 → 구현. |
| 2 | 카테고리별 시간 집계 | ★ | `durationByCategory(events, rules)`(work/comm/... 합) + 테스트. |
| 3 | 집중 점수 | ★ | 세션 길이·전환 횟수로 `focusScore(sessions)` + 경계 테스트(세션 0개, 단일 세션). |
| 4 | 시간대 히트맵 | ★★ | 시(hour)별 사용시간 버킷 `byHour(events)` + 테스트. |
| 5 | 딴짓 비율 | ★★ | 카테고리 규칙으로 업무/비업무 비율 `focusRatio(events, rules)` + 테스트. |

## 권장 경로
- **초급/시간 부족:** slice #1 — labs 의 test-first 패턴과 동일해 가장 안전합니다.
- **여유:** #1 완료 후 #2(카테고리 집계)로 확장하면 "신규 함수 설계 → 스펙 → 테스트 → 구현"을 한 번 더 경험합니다.

## 2일 매핑
- Day1: 스펙 채택(S1) → User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
- Day2: 하네스·게이트(S1~S3) → **test-first 구현**(S4~S5) → Custom Skill(S6) → 공유(S7)
