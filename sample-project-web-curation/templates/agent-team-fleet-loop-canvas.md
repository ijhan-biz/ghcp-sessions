# Agent Team / Fleet / Loop Canvas (Day2-S2 · S3)

## Agent Team Canvas — LG 기능팀 매핑
| 역할 | 기능팀 매핑 | 할 일 |
| --- | --- | --- |
| Planner | PL/담당자 | 스펙·AC·plan·risk tier |
| Generator | 기능 담당 개발자 | test-first 구현 후보 |
| Evaluator | 리뷰어/동료/PL | diff·테스트 검토(pass/revise/block) |
| Harness | 품질/플랫폼 | policy-check·wrapper·gate |
| Approval Owner | PL/아키텍트/보안 | 고위험 승인 또는 block |

## 위험도별 토폴로지
| 위험 | 토폴로지 | 하드 게이트 |
| --- | --- | --- |
| Small | Solo·Planner-Generator | 로컬 test |
| Medium | Planner-Generator-Evaluator | policy-check + 리뷰 |
| High | Harness-Gated·Orchestrator-Worker | approval_id + rollback owner |
| Critical | Control Tower + Human Approval | 100% 사람 리뷰 |

## Fleet 설계표
| Fleet 역할 | 모델 기준 | 노출 도구 | 중단 조건 |
| --- | --- | --- | --- |
| Planner agent | 고추론/조직표준 | read·search | scope 불명확 |
| Generator agent | 빠른/중간 | allowed files edit | blocked file 변경 |
| Evaluator agent | auto/비용효율 | read·test log | AC 미충족 |
| Harness agent | checker 우선 | test·lint·policy-check | gate 실패 |

## Loop Canvas (Plan→Generate→Evaluate→Fix→Gate)
| 단계 | 역할 | 산출물 | Gate/Stop |
| --- | --- | --- | --- |
| Plan | Planner | plan·Context Manifest·Test Matrix | scope 불명확 stop |
| Generate | Generator | 실패 테스트·최소 구현 diff | blocked file stop |
| Evaluate | Evaluator | pass/revise/block | AC 미충족 revise |
| Fix | Generator | 수정 diff | 동일 실패 2회 → 사람 리뷰 |
| Gate | Harness | evidence bundle | gate 통과 전 진행 금지 |

## Hard gate (반드시 block/revise)
- approval_id 없는 write/destructive/prod/customer-data → block
- rollback owner 없는 운영 변경 → block
- 검증 기준 없는 Evaluator 판정 → revise
- CD_ratio > 0.35 (결함/주장 비율) → 발행 block
