# 기능 스펙 카드 — 개인 활동 로그 분석 엔진 (폴백 실습용·대안, 혼자 쓰는 업무 도구)

> 본인 기능을 가져오지 못한 경우, 이 스펙을 **"내 기능 스펙 카드"** 로 채택해 2일 과정을 진행하세요.
> (비식별 예시, secret 없음. 순수 분석·테스트는 실제 OS 접근 불필요. 실시간 모니터링은 Windows 실수집을 선택적으로 사용하며 앱 이름만 취득.)
>
> ✏️ **[강의 중 확인·변경]** 표시가 있는 부분은 강의(Day1~Day2)에서 참가자가 **자기 기능에 맞게 확인·채움·변경**하는 칸입니다. 표시가 없는 부분(예: 집중 세션 규칙·게이트)은 그대로 두고 진행하세요.

## 무슨 앱인가  ✏️ [강의 중 확인·변경]
내 컴퓨터의 **앱 사용 기록(활동 이벤트)**을 분석해 "오늘 어디에 시간을 썼는지 · 딴짓/유휴로 끊긴 **집중 세션**은 언제인지"를 알려 주는 **혼자 쓰는 업무 도구**입니다.
"집중 세션"은 감이 아니라 **유휴 간격 임계라는 고정 규칙**으로 정합니다(정답이 명확 → 테스트 가능).

## 설계 경계 (중요)
- **수집(OS 프로세스)과 분석을 주입 가능한 `collector`로 분리**합니다. OS 의존·프라이버시·비결정성 때문에 **테스트에서는 fake collector**를 주입해 로컬에서 **결정론적으로** 검증합니다.
- 분석 로직(집계·세션화·요약·리포트 렌더)은 **순수 함수**입니다. 창 제목/URL 원문은 다루지 않고 **앱/카테고리 단위**로만(비식별).
- **실 수집기 구현됨(선택적 사용)**: `src/collector.windows.js`가 Windows 포그라운드 앱의 **프로세스 이름만**(창제목/URL 없이) 샘플링. `src/collector.js`의 샘플링 수집기로 이벤트화. 순수 로직과는 계속 분리되며, 시뮬레이터(`MODE=sim`)로 폴백 가능.

## 집중 세션 규칙 (고정)
- 이벤트를 시간순으로 이어 붙이되, 직전 세션과 다음 이벤트의 **유휴 간격이 `idleGapMs`를 초과하면 새 세션**으로 나눈다.
- 간격이 `idleGapMs` **이하면 같은 세션**(end 확장), 초과면 분리 → "유휴로 끊긴 집중 블록"을 얻는다.
- ✏️ [강의 중 확인·변경] `idleGapMs` 임계값(기본 5분)은 자기 기준에 맞게 조정 가능(규칙 구조는 고정).

## 스펙
- 기능명: 개인 활동 로그 분석 엔진 + 실시간 모니터링 대시보드  ✏️ [강의 중 확인·변경: 자기 기능명으로]
- 현재 동작(구현 완료):
  - 앱별 **사용시간 합**(`durationByApp`), 앱→**카테고리**(`categorize`), **상위 앱**(`topApps`).
  - 주입된 `collector`로 활동 이벤트 **수집**(`collectEvents`), 실패 시 안전 처리.
  - ✅ **집중 세션 분리(`sessionize`)**: 유휴 간격 기준으로 세션 분리(`idleGapMs` 이하면 같은 세션).
  - ✅ **요약 모델·대시보드 렌더**(`src/report.js`): 생산성 pulse(0–100)·상위앱·카테고리·집중 타임라인을 RescueTime Solo Focus 풍 HTML로 렌더(`buildSummary`/`renderDashboardBody`/`renderDashboardHTML`, 앱명 escape).
  - ✅ **실시간 모니터링 서버**(`scripts/serve.mjs`): 의존성 0(Node `http` + SSE), 2초 주기 push. Windows에서는 실데이터(포그라운드 앱) 수집, `MODE=sim`은 시뮬레이터.
- 선택/후속 후보: 카테고리별 시간 집계, 집중 점수(연속 세션 길이 vs 전환 횟수), 시간대 히트맵.  ✏️ [강의 중 확인·변경: 다음 slice 선택]
- 사용자/시스템 영향: 내 시간이 어디로 갔는지 + 딴짓으로 끊긴 구간을 실시간으로 드러내 **회고·타임트래킹**에 도움.
- 제외 범위(non-goal): 원시 **창제목/URL 저장**, 클라우드 업로드, DB 영구화, 비Windows OS 실수집(현재는 Windows만 실수집·타 OS는 `MODE=sim`).
- 민감정보 제거 확인: [x] 창 제목/URL 원문·계정·secret 없음 (앱/프로세스·카테고리 단위, 비식별)  ✏️ [강의 중 확인: 자기 데이터로 재확인]

## Acceptance Criteria (현재 상태 반영 — 전부 green)  ✏️ [강의 중 확인·변경: 자기 AC로 다듬기]
| AC | 범주 | 검증 방법 |
| --- | --- | --- |
| 앱별 사용시간 합(무효 이벤트 제외) | 정상 | `npm test` |
| 앱→카테고리, 규칙 없으면 other | 정상 | `npm test` |
| 사용시간 내림차순 상위 N | 정상 | `npm test` |
| topN<=0 → 빈 배열 | 경계 | `npm test` |
| start>=end 무효 이벤트는 집계 제외 | 예외 | `npm test` |
| collector 미주입/실패 → 빈 배열(안전 처리) | 예외 | `npm test` (fake 주입) |
| 유휴 간격 초과 시 세션 분리 | 정상 | `npm test` |
| 간격이 정확히 idleGap이면 같은 세션 | 경계 | `npm test` |
| 요약·pulse·카테고리·세션 산출(`buildSummary`) | 정상 | `npm test` |
| 대시보드 핵심 섹션 렌더 + 앱명 escape(XSS/비식별) | 예외 | `npm test` |
| 실시간 본문만 렌더 + `live`시 SSE 주입 | 정상 | `npm test` |
| 샘플링 수집기: 같은 앱 연장·전환/유휴 시 새 이벤트 | 정상 | `npm test` |

## Context Manifest (현재)  ✏️ [강의 중 확인·변경: 자기 파일 범위로]
| 구분 | 파일 |
| --- | --- |
| allowed | `src/activity.js`, `src/report.js`, `src/collector.js`, `src/collector.windows.js`, `test/*.test.js`, `scripts/report.mjs`, `scripts/serve.mjs` |
| blocked | `.env`, `prod/*`, `secrets/*` |
| test | `test/activity.test.js`, `test/report.test.js` |
| output | `dist/activity-report.html`(정적 리포트) |

## 실행 명령
| 명령 | 설명 |
| --- | --- |
| `npm test` / `npm run gate` | 유닛테스트 / lint+test+policy-check 게이트 |
| `npm run report` | 정적 HTML 대시보드 생성(`dist/activity-report.html`) |
| `npm run serve` | 실시간 모니터링 서버(기본 `http://localhost:7333`). Windows=실데이터, `MODE=sim`=시뮬레이터, `PORT`로 포트 변경 |
