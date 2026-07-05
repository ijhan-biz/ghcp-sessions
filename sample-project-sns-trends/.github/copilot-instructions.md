# 팀 공통 가드레일 (모든 요청에 항상 적용)

이 워크스페이스는 SDD 실습용 **유명 SNS 트렌드 분석 엔진**이다. 아래 규칙을 모든 요청에 적용한다.
상세 역할·토폴로지·게이트는 `templates/agent-team-fleet-loop-canvas.md`를 따른다.

## 에이전트 팀 (`.github/agents/`)
| 역할 | 에이전트 | 하는 일 |
| --- | --- | --- |
| Orchestrator | `team-orchestrator` | Loop(Plan→Generate→Evaluate→Fix→Gate)를 완료까지 조율 |
| Planner | `feature-sdd-planner` | 스펙·AC·Context Manifest·Test Matrix·risk tier |
| Generator | `generator` | AC 1개 test-first(실패 테스트→최소 구현) |
| Evaluator | `evaluator` | AC 기준 pass/revise/block 판정 |
| Harness | `harness` | `npm run gate`(lint+test+policy-check) 실행·증거 |

## 진행 원칙
- Loop는 **한 단계씩**, 각 단계 끝 stop point에서 산출물과 다음 단계를 보고한다.
- Generator는 한 번에 **AC 1개**만 test-first로 구현한다.
- **같은 실패 2회** 반복 → 사람 리뷰로 에스컬레이션.
- `npm run gate` **통과 전에는 "완료" 선언 금지.**

## 경계 (Context Manifest)
- allowed: `src/trends.js`, `test/trends.test.js`
- blocked: `.env`, `prod/*`, `secrets/*`
- 함수 시그니처·순수 함수 구조 유지. 검색(수집)은 주입된 `fetch`로 분리, 테스트는 fake fetcher로 결정론 검증.

## Hard gate (반드시 block/revise)
- approval_id 없는 write/destructive/prod/customer-data → **block**
- rollback owner 없는 운영 변경 → **block**
- 검증 기준 없는 Evaluator 판정 → **revise**
- CD_ratio(결함/주장 비율) > 0.35 → 발행 **block**

## 금지
- blocked 파일 수정, 외부 패키지 추가, production/deploy/secret 자동 실행.
- 게이트 우회(`--no-verify` 등), gate 미통과 상태의 완료 선언.
