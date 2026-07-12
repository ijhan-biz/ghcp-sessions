# sample-project-activity-log — 전원 공통 실습 프로젝트

**개인 활동 로그 분석 엔진.** 45명 self-paced 수업에서 전원이 같은 <code>sessionize</code> slice와 16개 checkpoint를 사용합니다. 개인 프로젝트 적용은 공통 GREEN 후 선택하거나 D+7로 보냅니다. 의존성 없이 Node 18+로 동작합니다.

> **설계 경계:** 실제 OS/브라우저 수집은 **주입 가능한 `collector`로 분리**합니다(OS 의존·프라이버시·비결정성 → 테스트 불가).
> 테스트에서는 fake collector를 주입하고, 집계·세션화·요약 같은 **순수 로직**만 결정론적으로 검증합니다. 창 제목/URL 원문은 다루지 않고 **앱/카테고리 단위**(비식별)로만 분석합니다.

## 45명 · 강사 1인 Self-paced 모드

브라우저에서 [`SELF-PACED-LAB.html`](SELF-PACED-LAB.html)을 열고 아래 네 줄부터 실행하세요. starter의 미작성 항목을 직접 채워야 checkpoint가 PASS합니다.

```sh
cd sample-project-activity-log
npm run lab -- doctor
npm run lab -- status
npm run lab -- start d1-s0
```

일반 단계는 `check → hint 1 → hint 2 → reset → example → 질문` 순서입니다. `example`은 정답이 아닌 구조 예시이며, `recover`는 D2·S4 GREEN 전용으로 FALLBACK과 D+7 부채를 남깁니다.

## 시작
```sh
cd sample-project-activity-log
npm test        # baseline: 5 pass, 2 skip(Day2-S4에서 켤 테스트)
```

## 이렇게 진행하세요
1. `FEATURE-SPEC.md`를 참고해 `lab-work/feature-spec.md`를 직접 작성 (D1·S1)
2. 공통 slice인 집중 세션 분리 `sessionize`를 사용
3. **D1**: User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
4. **D2**: 하네스·게이트(S1~S3) → test-first 로 `test/activity.test.js` 의 `skip` 해제 → `src/activity.js` 의 `sessionize` 구현(S4~S5) → Custom Skill(S6) → 공유(S7)

## 파일
| 파일 | 용도 |
| --- | --- |
| `FEATURE-SPEC.md` | 비식별 기능 스펙 카드(참가자가 채택) |
| `BACKLOG.md` | slice 후보(하나 골라 진행) |
| `src/activity.js` | 대상 코드(`sessionize` = TODO) |
| `test/activity.test.js` | 통과 5 + skip 2(구현 대상) |
| `.vscode/tasks.json` | `Lab: Verify Workspace Root` task로 실제 VS Code 창 루트 증명 |

## 빠른 명령
| 명령 | 설명 |
| --- | --- |
| `npm test` | 유닛테스트(node --test) |
| `npm run lab -- status` | 16개 self-paced checkpoint 진도 |
| `npm run lab -- start/check/hint/reset <step>` | 단계 안내·자동검사·일반 복구 |
| `npm run lab -- example <step>` | reset 뒤 사용하는 비정답 구조 예시 |
| `npm run lab -- recover d2-s4-green` | D2·S4 전용 solution restore + FALLBACK 기록 |
| `npm run lab:selftest` | lab runner 하네스 자체 테스트 |
| `npm run lab:dry-run` | 45명 코호트 30회 결정론 시뮬레이션 |
| `npm run spec-check` | '좋은 입력' 스펙 자가검증(정상·예외·경계 AC·비식별) |
| `node scripts/token-estimate.mjs <파일>` | 첨부 토큰 근사치(범위 한정 효과 비교) |
| `npm run gate` | lint + test + lab:selftest + policy-check (로컬 품질 게이트) |
| `npm run packet` | local review packet 생성 |

Day2 시작 시 VS Code에서 **Terminal → Run Task → Lab: Verify Workspace Root**를 실행하세요. 공개 정답 파일은 제공하지 않으며, solved checkpoint와 소스가 정확히 일치하면 packet은 `REFERENCE-MATCH`로 기록해 D+7 재구현 부채를 요구합니다.
