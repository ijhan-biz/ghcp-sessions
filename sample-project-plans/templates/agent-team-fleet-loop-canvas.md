# Agent Team / Fleet / Loop Canvas (완성 예시 · Day2-S2 · S3)

이 프로젝트에는 캔버스가 **실제 파일로** 구현돼 있습니다 — `.github/agents/` 의 5개 에이전트가 아래 역할에 대응합니다.

## Agent Team Canvas — 역할 ↔ 파일
| 역할 | 파일 | 할 일 |
| --- | --- | --- |
| Orchestrator | `.github/agents/team-orchestrator.agent.md` | Plan→Generate→Evaluate→Fix→Gate 를 완료까지 조율 |
| Planner | `.github/agents/planner.agent.md` | 스펙·AC·Context Manifest·Test Matrix·risk tier |
| Generator | `.github/agents/generator.agent.md` | AC 1개 실패 테스트 → 최소 구현(allowed 파일만) |
| Evaluator | `.github/agents/evaluator.agent.md` | diff·테스트 검토(pass/revise/block, 근거 명시) |
| Harness | `.github/agents/harness.agent.md` | `npm run gate`(lint·test·policy-check) |

## 위험도별 토폴로지
| 위험 | 토폴로지 | 하드 게이트 |
| --- | --- | --- |
| Small | Solo·Planner-Generator | 로컬 test |
| Medium | Planner-Generator-Evaluator | policy-check + 리뷰 |
| High | Harness-Gated·Orchestrator-Worker | approval_id + rollback owner |
| Critical | Control Tower + Human Approval | 100% 사람 리뷰 |

## Loop Canvas (Plan→Generate→Evaluate→Fix→Gate)
| 단계 | 역할 | 산출물 | Gate/Stop |
| --- | --- | --- | --- |
| Plan | Planner | plan·Context Manifest·Test Matrix | scope 불명확 stop |
| Generate | Generator | 실패 테스트·최소 구현 diff | blocked file stop |
| Evaluate | Evaluator | pass/revise/block | AC 미충족 revise |
| Fix | Generator | 수정 diff | 동일 실패 2회 → 사람 리뷰 |
| Gate | Harness | evidence bundle(`npm run gate`) | gate 통과 전 진행 금지 |

## Hard gate (반드시 block/revise)
- approval_id 없는 write/destructive/prod/customer-data → block
- rollback owner 없는 운영 변경 → block
- 검증 기준 없는 Evaluator 판정 → revise
- CD_ratio > 0.35 (결함/주장 비율) → 발행 block

## 생성 위치 — GitHub Copilot이 바로 인식하는 곳 (이 프로젝트에 실제로 있음)
| 캔버스 산출물 | 이 프로젝트의 파일 | Copilot이 쓰는 방식 |
| --- | --- | --- |
| 역할별 에이전트 | `.github/agents/<role>.agent.md` (5개) | Chat 모드 선택기에 커스텀 에이전트로 표시 |
| 팀 공통 규칙·가드레일 | `.github/copilot-instructions.md` | 모든 요청에 항상 적용 |
| 특정 파일 규칙 | `.github/instructions/src.instructions.md` (`applyTo` glob) | 매칭 파일 편집 시 적용 |
| 반복 작업 | `.github/prompts/card-slice.prompt.md` | Chat에서 `/card-slice` 로 호출 |
| 다단계 스킬 | `skills/plans-board-skill.md`, `skills/sdd-skill.md` | 에이전트가 스킬로 로드 |
| 로컬 게이트 | `npm run gate` | 편집 전/후 검증·정책 |

> 경로·인식 방식은 VS Code 버전에 따라 다를 수 있으니, [VS Code Copilot 기능 가이드](../../docs/vscode-features.html) 와 공식 문서를 현재 버전 기준으로 재확인하세요. 위 `model:`·`tools:` 값은 예시이며, model picker 표시가 아니라 세션 로그로 실제 호출 모델을 검증하세요.
