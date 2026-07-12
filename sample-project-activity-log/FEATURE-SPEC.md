# 기능 스펙 카드 — 개인 활동 로그 분석 엔진 (전원 공통 실습)

> 모든 참가자가 이 비식별 스펙과 공통 <code>sessionize</code> slice로 2일 checkpoint를 진행합니다.
> (비식별 예시, secret 없음. 실제 OS/브라우저 접근 불필요.)

## 무슨 앱인가
내 컴퓨터의 **앱 사용 기록(활동 이벤트)**을 분석해 "오늘 어디에 시간을 썼는지 · 딴짓/유휴로 끊긴 **집중 세션**은 언제인지"를 알려 주는 **혼자 쓰는 업무 도구**입니다.
"집중 세션"은 감이 아니라 **유휴 간격 임계라는 고정 규칙**으로 정합니다(정답이 명확 → 테스트 가능).

## 제품 방향 레퍼런스 — ActivityWatch
[ActivityWatch](https://github.com/ActivityWatch/activitywatch)는 watcher가 수집한 시간 구간 event를 로컬에서 분석해 앱·웹사이트·카테고리별 요약과 타임라인을 보여 주는 오픈 소스 프로젝트입니다. [event·bucket 모델](https://docs.activitywatch.net/en/latest/buckets-and-events.html)과 [watcher 구조](https://docs.activitywatch.net/en/latest/watchers.html)는 방향을 이해하기 위한 참고이며, 이 실습은 ActivityWatch 호환 구현이 아닙니다.

| 범위 | 이번 과정에서 의미 | Day1에 쓸 내용 |
| --- | --- | --- |
| **Core · Day2 구현** | 기존 집계·분류·상위 앱·fake collector 계약을 유지하고 `sessionize`만 test-first로 완성 | 사용자 가치, `{ app, start, end }` 입력, `[{ start, end, count }]` 출력, `idleGapMs` 경계, AC·테스트 |
| **Stretch · 선택 사항** | 기본값 none. core와 gate가 GREEN이고 시간이 남을 때만 카테고리별 시간, 명시적 AFK 상태 필터, 하루 타임라인/날짜 필터, 합성 JSON import/export 중 0개 또는 1개 | 별도 backlog와 새 AC로 분리하고 Day2 완료 기준·core 스펙에는 섞지 않음 |
| **Out · 이번 과정 제외** | 실제 OS/browser watcher, 원본 창 제목·URL 저장, DB·서버·전체 UI, REST/query/API 호환 | non-goal·blocked 데이터/파일로 명시 |

> **모델 차이:** ActivityWatch event는 `timestamp + duration + data` 개념을 사용하지만, 교육 프로젝트의 고정 계약은 `start/end`(ISO 또는 ms)입니다. 로컬 데이터도 민감할 수 있으므로 원본 창 제목·URL 없이 합성 event만 사용합니다.

## 설계 경계 (중요)
- **실제 수집(OS 프로세스·브라우저 기록)은 주입 가능한 `collector`로 분리**합니다. OS 의존·프라이버시·비결정성 때문에 **테스트에서는 fake collector**를 주입해 로컬에서 **결정론적으로** 검증합니다.
- 분석 로직(집계·세션화·요약)은 **순수 함수**입니다. 창 제목/URL 원문은 다루지 않고 **앱/카테고리 단위**로만(비식별).

## 집중 세션 규칙 (고정)
- 이벤트를 시간순으로 이어 붙이되, 직전 세션과 다음 이벤트의 **유휴 간격이 `idleGapMs`를 초과하면 새 세션**으로 나눈다.
- 간격이 `idleGapMs` **이하면 같은 세션**(end 확장), 초과면 분리 → "유휴로 끊긴 집중 블록"을 얻는다.

## 고정 core 구현 계약 (선택 항목 아님)
- 유효 event만 남겨 시작 시각 오름차순으로 처리하고, 겹치는 event는 현재 세션의 end를 최대값으로 확장한다.
- 입력의 `start/end`는 ISO 문자열 또는 ms이며, `sessionize` 출력의 `start/end`는 ms·시간순이다.
- Day2의 새 필수 증거는 `test/activity.test.js`에 이미 skip된 sessionize 테스트 2개입니다. 이 계약을 새 checkpoint AC·테스트로 늘리지 말고, 같은 파일의 activity 핵심 baseline 5개와 함께 회귀 여부를 확인합니다(전체 `npm test`에는 routing 테스트 3개가 더 있습니다).

## 스펙
- 기능명: 개인 활동 로그 분석 엔진
- 현재 동작:
  - 앱별 **사용시간 합**(`durationByApp`), 앱→**카테고리**(`categorize`), **상위 앱**(`topApps`).
  - 주입된 `collector`로 활동 이벤트 **수집**(`collectEvents`), 실패 시 안전 처리.
- 원하는 동작(개선/추가):
  - **집중 세션 분리(`sessionize`)**: 유휴 간격 기준으로 세션을 나눈다. (← 우선 slice, test-first)
  - (선택) 카테고리별 시간 집계, 집중 점수(연속 세션 길이 vs 전환 횟수), 시간대 히트맵.
- 사용자/시스템 영향: 내 시간이 어디로 갔는지 + 딴짓으로 끊긴 구간을 드러내 **회고·타임트래킹**에 도움.
- 제외 범위(non-goal): **실제 OS/브라우저 수집기 구현·상시 백그라운드 수집·원시 창제목/URL 저장**(테스트는 fake collector로 대체), 클라우드 업로드, DB.
- 민감정보 제거 확인: [x] 창 제목/URL 원문·계정·secret 없음 (앱/카테고리 단위, 비식별)

## Acceptance Criteria (예시 — Day1·S2에서 다듬기)
| AC | 범주 | 검증 방법 |
| --- | --- | --- |
| 앱별 사용시간 합(무효 이벤트 제외) | 정상 | `npm test` |
| 앱→카테고리, 규칙 없으면 other | 정상 | `npm test` |
| 사용시간 내림차순 상위 N | 정상 | `npm test` |
| topN<=0 → 빈 배열 | 경계 | `npm test` |
| start>=end 무효 이벤트는 집계 제외 | 예외 | `npm test` |
| collector 미주입/실패 → 빈 배열(안전 처리) | 예외 | `npm test` (fake 주입) |
| 유휴 간격 초과 시 세션 분리 | 정상 | `npm test` (skip 해제 후) |
| 간격이 정확히 idleGap이면 같은 세션 | 경계 | `npm test` (skip 해제 후) |

## Context Manifest (Day1·S3에서 채우기)
| 구분 | 파일 |
| --- | --- |
| allowed | `src/activity.js`, `test/activity.test.js` |
| blocked | `.env`, `prod/*`, `secrets/*` |
| test | `test/activity.test.js` |
| unknown | (실제 OS/브라우저 수집기는 과정 범위 밖 — fake collector로 대체) |
