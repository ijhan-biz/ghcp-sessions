# sample-project-activity-log — 폴백 실습 프로젝트 (대안 도메인 · 혼자 쓰는 업무 도구)

**개인 활동 로그 분석 엔진.** 내 컴퓨터의 앱 사용 기록(활동 이벤트)을 분석해 **앱별 사용시간·집중 세션**을 요약하는, 혼자 쓰는 업무 도구입니다. 본인 기능을 못 가져온 참가자가 "내 기능"처럼 채택해 Day1~Day2 전 과정을 진행하는 **폴백 실습 프로젝트**입니다. 의존성 없이 Node 18+ 로 동작합니다.

> **설계 경계:** 실제 OS/브라우저 수집은 **주입 가능한 `collector`로 분리**합니다(OS 의존·프라이버시·비결정성 → 테스트 불가).
> 테스트에서는 fake collector를 주입하고, 집계·세션화·요약 같은 **순수 로직**만 결정론적으로 검증합니다. 창 제목/URL 원문은 다루지 않고 **앱/카테고리 단위**(비식별)로만 분석합니다.

## 시작
```sh
cd sample-project-activity-log
npm test        # baseline: 5 pass, 2 skip(Day2-S4에서 켤 테스트)
```

## 이렇게 진행하세요
1. `FEATURE-SPEC.md` 를 "내 기능 스펙 카드"로 채택 (D1·S1)
2. `BACKLOG.md` 에서 slice 1개 선택 (권장 #1: 집중 세션 분리 `sessionize`)
3. **D1**: User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
4. **D2**: 하네스·게이트(S1~S3) → test-first 로 `test/activity.test.js` 의 `skip` 해제 → `src/activity.js` 의 `sessionize` 구현(S4~S5) → Custom Skill(S6) → 공유(S7)
5. 정답 비교: `src/activity.solution.js`

## 파일
| 파일 | 용도 |
| --- | --- |
| `FEATURE-SPEC.md` | 비식별 기능 스펙 카드(참가자가 채택) |
| `BACKLOG.md` | slice 후보(하나 골라 진행) |
| `src/activity.js` | 대상 코드(`sessionize` = TODO) |
| `test/activity.test.js` | 통과 5 + skip 2(구현 대상) |
| `src/activity.solution.js` | 참고 정답(`sessionize` 구현 예) |

## 빠른 명령
| 명령 | 설명 |
| --- | --- |
| `npm test` | 유닛테스트(node --test) |
| `npm run spec-check` | '좋은 입력' 스펙 자가검증(정상·예외·경계 AC·비식별) |
| `node scripts/token-estimate.mjs <파일>` | 첨부 토큰 근사치(범위 한정 효과 비교) |
| `npm run gate` | lint + test + policy-check (로컬 품질 게이트) |
| `npm run packet` | local review packet 생성 |
