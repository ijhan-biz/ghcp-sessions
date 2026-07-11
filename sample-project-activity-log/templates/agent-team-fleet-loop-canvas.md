# Agent Team / Fleet / Loop Canvas (Day2-S2)

## Agent Team Canvas — 역할 매핑
| 역할 | 담당 | 허용 도구 | 산출물 |
| --- | --- | --- |
| Planner | [D2-S2 작성] | [D2-S2 작성] | [D2-S2 작성] |
| Generator | [D2-S2 작성] | [D2-S2 작성] | [D2-S2 작성] |
| Evaluator(Generator와 독립) | [D2-S2 작성] | [D2-S2 작성] | pass/revise/block + 근거: [D2-S2 작성] |
| Harness | [D2-S2 작성] | [D2-S2 작성] | Gate 결과: [D2-S2 작성] |
| Approval Owner | [D2-S2 작성] | [D2-S2 작성] | [D2-S2 작성] |

## Fleet 설계표
| Fleet 역할 | 모델 기준 | 노출 도구 | 중단 조건 |
| --- | --- | --- | --- |
| Planner agent | [D2-S2 작성] | [D2-S2 작성] | [D2-S2 작성] |
| Generator agent | [D2-S2 작성] | [D2-S2 작성] | [D2-S2 작성] |
| Evaluator agent | [D2-S2 작성] | [D2-S2 작성] | [D2-S2 작성] |
| Harness agent | [D2-S2 작성] | [D2-S2 작성] | [D2-S2 작성] |

## Loop Canvas (Plan→Generate→Evaluate→Fix→Gate)
| 단계 | 역할 | 산출물 | Gate/Stop |
| --- | --- | --- | --- |
| Plan | Planner | [D2-S2 작성] | [D2-S2 작성] |
| Generate | Generator | [D2-S2 작성] | [D2-S2 작성] |
| Evaluate | 독립 Evaluator | pass/revise/block: [D2-S2 작성] | [D2-S2 작성] |
| Fix | Generator | [D2-S2 작성] | 동일 실패 [D2-S2 작성]회 → 사람 리뷰 |
| Gate | Harness | [D2-S2 작성] | 중단 조건: [D2-S2 작성] |

## Hard Gate
- 승인 없는 위험 작업: [D2-S2 작성]
- rollback owner 없는 변경: [D2-S2 작성]
- 검증 기준 없는 Evaluator 판정: [D2-S2 작성]
