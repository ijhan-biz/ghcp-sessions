# 슬라이스 백로그 — 하나만 골라 2일 진행

각 slice는 **1~2개 파일에서 test-first 로 끝낼 수 있는 얇은 단위**입니다.

| # | slice | 난이도 | 무엇을 |
| --- | --- | --- | --- |
| 1 | URL 정규화 중복제거 | ★ (권장 시작) | `normalizeUrl` 구현(host 소문자·끝슬래시·utm 제거·fragment 제거). `test/curate.test.js` skip 2개 해제 → 구현. |
| 2 | 도메인 allowlist 필터 | ★ | 허용 도메인만 남기는 `filterByDomain(items, allow)` + 테스트. |
| 3 | 최소 점수 필터 | ★ | `filterByMinScore(items, min)` + 경계 테스트(min=0, 음수). |
| 4 | 쿼리 키워드 하이라이트 | ★★ | snippet에서 쿼리어를 표시(순수 문자열 처리) + 테스트. |
| 5 | 소스 다양성 보장 | ★★ | 같은 source 연속 노출 제한(라운드로빈) + 테스트. |

## 권장 경로
- **초급/시간 부족:** slice #1 — labs 의 test-first 패턴과 동일해 가장 안전합니다.
- **여유:** #1 완료 후 #2(allowlist)로 확장하면 "신규 함수 설계 → 스펙 → 테스트 → 구현"을 한 번 더 경험합니다.

## 2일 매핑
- Day1: 스펙 채택(S1) → User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
- Day2: 하네스·게이트(S1~S3) → **test-first 구현**(S4~S5) → Custom Skill(S6) → 공유(S7)
