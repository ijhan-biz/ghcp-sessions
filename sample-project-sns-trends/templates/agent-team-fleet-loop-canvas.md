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

## 생성 위치 — GitHub Copilot이 바로 인식하는 곳
> 위 캔버스의 역할·규칙·게이트를 "말"로만 두지 말고, VS Code Copilot이 **워크스페이스에서 자동 인식**하는 파일로 만들면 바로 쓸 수 있습니다. 경로는 **프로젝트 루트 기준**입니다(이 프로젝트를 VS Code 새 창에 열었을 때).

| 캔버스 산출물 | 만들 파일 (위치) | Copilot이 쓰는 방식 |
| --- | --- | --- |
| 역할별 에이전트(Planner/Generator/Evaluator/Harness) | `.github/agents/<role>.agent.md` | Chat **모드 선택기**에 커스텀 에이전트로 표시 → 역할을 골라 실행 |
| 팀 공통 규칙·가드레일 | `.github/copilot-instructions.md` | 모든 요청에 **항상 적용**(금지 파일·시그니처 유지 등) |
| 특정 파일에만 적용할 규칙 | `.github/instructions/<name>.instructions.md` (`applyTo` glob) | 매칭 파일 편집 시 적용 |
| 반복 작업(릴리스 노트 등) | `.github/prompts/<name>.prompt.md` | Chat에서 `/<name>`으로 호출 |
| 다단계 워크플로·스크립트 묶음 | Agent skill `SKILL.md` (`.github/skills/<name>/` = VS Code 인식, 또는 이 과정 예시 `skills/sdd-skill.md`를 에이전트가 참조) | 에이전트가 스킬로 로드 |
| 사전/사후 게이트 자동 실행 | Hooks(에이전트 세션 훅) + 로컬 게이트 `npm run gate` | 편집 전/후 검증·정책 자동 실행 |
| 외부 도구·데이터 | MCP `.vscode/mcp.json` | 에이전트가 외부 도구를 호출 |

- **기본 오케스트레이터 제공**: 이 Loop를 자동으로 이끄는 `team-orchestrator`가 `.github/agents/team-orchestrator.agent.md`로 **기본 포함**돼 있습니다. Agent 모드에서 이 에이전트를 골라 Plan→Generate→Evaluate→Fix→Gate를 **완료까지** 진행합니다(각 단계 stop point·Hard gate 준수, `npm run gate` 통과 전 완료 금지).
- **역할 = 에이전트 1파일** 원칙: 캔버스의 Planner/Generator/Evaluator/Harness를 각각 `.github/agents/planner.agent.md`처럼 만들면 Agent 모드에서 역할을 골라 **생성과 검토를 분리**할 수 있습니다.
- **`.agent.md` frontmatter**: 파일 앞 YAML에 `name`·`description`·(선택)`model`·`tools`를 둡니다 — 이 과정 예시: `.github/agents/feature-sdd-planner.agent.md`.
- **적용 확인**: 파일을 추가한 뒤 Chat 모드 선택기(또는 명령 팔레트)에 에이전트가 뜨는지 봅니다. 안 뜨면 VS Code 창을 **이 프로젝트 루트**로 열었는지(경로가 프로젝트 기준인지) 확인하세요.

> 경로·인식 방식은 VS Code 버전에 따라 다를 수 있으니, [VS Code Copilot 기능 가이드](../../docs/vscode-features.html)의 「커스터마이징」과 공식 문서를 현재 버전 기준으로 재확인하세요.
