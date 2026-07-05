# 기능 스펙 카드 — 검색 결과 수집·정리(크롤링 + 큐레이션) 엔진 (폴백 실습용·대안)

> 본인 기능을 가져오지 못한 경우, 이 스펙을 **"내 기능 스펙 카드"** 로 채택해 2일 과정을 진행하세요.
> (loyalty 대신 이 도메인을 골라도 됩니다. 비식별 예시, secret 없음.)

## 설계 경계 (중요)
- **웹 크롤링(fetch)을 포함하되, 네트워크 I/O는 주입 가능한 `fetch`로 분리**합니다. 실제 네트워크 호출 대신 **테스트에서는 fake fetcher**를 주입해 로컬에서 **결정론적으로** 검증합니다(네트워크·비결정성·API 키에 의존하지 않음).
- 파이프라인: **크롤링(수집) → URL 정규화·중복제거 → 랭킹 → 요약**. 크롤링은 "얇은 I/O 경계"로, 큐레이션은 "순수 로직"으로 분리해 각각 테스트합니다.

## 스펙
- 기능명: 검색 결과 수집·정리(크롤링 + 큐레이션) 엔진
- 현재 동작:
  - 결과 목록을 점수 내림차순으로 **랭킹**한다.
  - 상위 N개를 `{title, url}`로 **요약**한다.
  - **완전히 동일한 URL** 중복을 제거한다.
- 원하는 동작(개선/추가):
  - **웹 크롤링 수집**: `crawlResults(query, { fetch })` — 주입된 `fetch`로 검색 결과를 수집해 `{title, url, snippet, score}[]`로 정규화. (실제 네트워크 대신 fake fetcher로 테스트)
  - **URL 정규화**로 변형 URL(끝 슬래시·utm 파라미터·host 대소문자·fragment)도 중복 제거한다. (← 우선 slice)
  - (선택) 도메인 allowlist 필터, 최소 점수/신선도 필터.
  - (선택) 쿼리 키워드 하이라이트, 소스 다양성 보장.
- 사용자/시스템 영향: 수집→중복·저품질 결과 제거로 **정리 품질** 향상.
- 제외 범위(non-goal): **실제 프로덕션 크롤러/외부 검색 API 키/rate-limit·robots.txt 처리**(테스트는 fake fetcher로 대체), LLM 요약, DB.
- 민감정보 제거 확인: [x] 고객명/계정/키/운영로그 없음

## Acceptance Criteria (예시 — Day1·S2에서 다듬기)
| AC | 범주 | 검증 방법 |
| --- | --- | --- |
| 점수 내림차순 랭킹 | 정상 | `npm test` |
| 상위 N 요약, N>len → 전체 | 정상 | `npm test` |
| N<=0 → 빈 배열 | 경계 | `npm test` |
| 완전 동일 URL 중복 제거 | 정상 | `npm test` |
| 끝 슬래시 변형 URL 중복 제거 | 경계 | `npm test` (skip 해제 후) |
| utm 트래킹 변형 URL 중복 제거 | 경계 | `npm test` (skip 해제 후) |
| N이 숫자가 아니거나 누락 → 빈 배열(방어) | 예외 | `npm test` (테스트 추가) |
| fake fetch가 결과 반환 → 파이프라인이 큐레이션 결과 반환 | 정상 | `npm test` (fake fetcher 주입) |
| fetch 빈 응답 → 빈 배열 | 경계 | `npm test` |
| fetch 실패/타임아웃 → 안전 처리(빈 배열 또는 오류) | 예외 | `npm test` (fake가 throw) |

## Context Manifest (Day1·S3에서 채우기)
| 구분 | 파일 |
| --- | --- |
| allowed | `src/curate.js`, `src/crawl.js`, `test/curate.test.js`, `test/crawl.test.js` |
| blocked | `.env`, `prod/*`, `secrets/*` |
| test | `test/curate.test.js`, `test/crawl.test.js` |
| unknown | (실제 검색 API 연동은 과정 범위 밖 — fake fetcher로 대체) |
