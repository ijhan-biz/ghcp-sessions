# labs — 세션별 실습 코드 (직접 실행하며 이해하기)

의존성 없이 **Node 18+ 내장 도구**(`node --test`)만으로 돌아갑니다. 별도 설치가 필요 없습니다.

```sh
cd labs
node -v          # v18 이상인지 확인
npm test         # baseline: 10 pass, 2 skip (Day2-S4에서 켤 테스트)
```

> 연속 코드베이스: 가상의 "결제(billing) 기능"을 Day1~Day2 내내 같은 파일로 키워 갑니다.
> `src/billing/tax.js`(부가세) · `src/billing/discount.js`(할인, 리팩토링 대상).

## 빠른 명령
| 명령 | 설명 |
| --- | --- |
| `npm run env` | 환경 준비도 점검(Green/Yellow/Red) |
| `npm test` | 유닛테스트(node --test) |
| `npm run spec-check` | '좋은 입력' 스펙 자가검증(정상·예외·경계 AC·비식별 확인) |
| `node scripts/token-estimate.mjs <파일...>` | 입력 토큰 근사치(Before/After 비율 비교·오프라인) |
| `npm run lint` | 의존성 없는 구문 검사(node --check) |
| `npm run policy-check` | 금지 파일/secret 패턴 감지 |
| `npm run gate` | lint + test + policy-check (로컬 품질 게이트) |
| `npm run sim` | 장기 실행 안전장치 시뮬레이션(cost burn·checkpoint·canary) |
| `npm run packet` | local review packet(review-packet.md) 생성 |
| `npm run routing` | 단계별 모델 라우팅 데모 |
| `zsh scripts/copilot-harness/run.zsh "<prompt>"` | Copilot CLI 하네스 래퍼(미설치 시 dry-run) |

## 세션 ↔ 실습 코드 매핑

### Day 1 — 좋은 입력
| 세션 | 무엇을 실행/작성 | 파일·명령 |
| --- | --- | --- |
| S0 환경·baseline | 환경 점검 + baseline 통과 확인 | `npm run env`, `npm test`, `git checkout -b lab/...` |
| S1 토큰·가드레일 | 범위 한정 프롬프트·비식별 스펙 | `templates/feature-spec-card.md`, `prompts/examples.md`, 대상: `src/billing/tax.js` |
| S2 좋은 프롬프트(1) | AC↔테스트 매핑 읽기 | `test/tax.test.js`, `prompts/examples.md` |
| S3 리팩토링·Context Manifest | 동작 유지 리팩토링 | `src/billing/discount.js` 리팩토링 후 `npm test`, `templates/context-manifest.md` |
| S4 Plan Mode·Test Matrix | 계획·매트릭스 작성 | `templates/plan-and-test-matrix.md`, `npm test` |
| S5 종합(Spec Pack v1) | 산출물 묶기 | 위 templates 취합 |

### Day 2 — 안전한 실행 + 나만의 솔루션
| 세션 | 무엇을 실행/작성 | 파일·명령 |
| --- | --- | --- |
| S0 복습·재점검 | baseline 재확인 | `npm run env`, `npm test`, `git status` |
| S1 하네스·CLI | 권한·로그 래퍼 실행 | `zsh scripts/copilot-harness/run.zsh "..."` |
| S2 Agent Teams·게이트 | 로컬 게이트 + 캔버스 | `npm run gate`, `scripts/policy-check.mjs`, `templates/agent-team-fleet-loop-canvas.md` |
| S3 본인 워크플로·장기실행 | 안전장치 체험 | `npm run sim` (seed 바꿔 재실행), 캔버스 작성 |
| S4 SDD test-first | 실패 테스트 켜고 구현 | `test/tax.test.js`의 `skip` 제거 → `src/billing/tax.js` 구현 → `npm test` |
| S5 통합·리뷰패킷 | 검증·패킷·롤백 | `npm run gate`, `npm run packet`, `templates/rollback-note.md` |
| S6 Custom Skill/Agent·라우팅 | Skill/Agent·모델 라우팅 | `skills/sdd-skill.md`, `.github/agents/feature-sdd-planner.agent.md`, `npm run routing` |
| S7 경험 공유 | 발표·핸드오프 | `templates/lightning-talk-and-handoff.md` |

## Day2-S4 핵심 실습 흐름 (test-first)
```sh
npm test                                   # AC1/AC2 는 skip 상태(baseline green)
# 1) test/tax.test.js 에서 두 곳의 { skip: true } 제거 → 테스트가 빨갛게 실패(RED)
# 2) src/billing/tax.js 의 calcVat 구현(음수 가드 + 면세 분기)
npm test                                   # GREEN
npm run gate                               # lint + test + policy-check 통과
# 정답 비교: src/billing/tax.solution.js
```
