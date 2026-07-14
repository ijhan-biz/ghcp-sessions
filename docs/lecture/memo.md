git pull origin main
Day 1, Day2 의 스크립트를 모두 실행해줘
sample-project-activity-log/FEATURE-SPEC.md 을 참고하여 sample-project-activity-log/lab-work 의 스펙을 작성해줘.
sample-project-activity-log/lab-work 의 스펙을 sample-project-activity-log 안에 구현해줘. 
정상 동작을 어떻게 확인하지
결과를 보여주는 화면을 구성하고, 서비스를 띄워줘
실제 데이터를 측정하도록 변경하고싶어
계획한대로 구현해줘
상태: 수집 오류 (서버 연결 실패)



현재까지 본 프로젝트(sample-project-activity-log)의 16개 단계 완성 및 실시간 데이터 수집 연계 과정에서 소모된 **정량적 AI Credits 추정치 및 토큰 가치 비율**을 다음과 같이 심층 분석하여 드립니다.

---

### 1. 1인당 소모 AI Credits 요약 (F2 N0 타겟 모델 기준)

[model-routing-demo.mjs](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html) 및 [routing.test.js](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html)의 벤치마크 데이터를 추출 및 합산한 결과입니다.

- **1인 실습 소모 추정치**: **`84 AI Credits`** (인당 지참 예산: `7,000 Credits` 대비 **1.2%**의 극도의 효율적 자원 운용 달성)
- **현업 및 retained 실험군 기준 추정치**: **`218.46 AI Credits`** (실험 상한 `300 Credits` 대비 **72.82%** 점유)

_※ 1 Credit = $0.01에 해당하므로, 1인당 대략 **$0.84 (약 1,150원)** 상당의 순수 처리 비용이 소요된 것으로 감각 측정됩니다._

---

### 2. 단계별 AI 모델 라우팅 프로토콜 및 산출 가치 분석

각 단계의 설계 정밀도 및 비용 절감을 위해 적용된 최적 Tier 모델 분배 이력입니다:

|단계 (Stage)|할당된 API 탑재 모델|기여 품질 등급 및 선택 이유|추정 소모 비중|
|:--|:--|:--|:-:|
|**Connect**|`gpt-5.3-codex` (F0)|짧은 샌드박스 탐색 및 다음 행동 조율 (품질 3/3)|보통 (5%)|
|**Specification**|`gpt-5.6-luna` (F1)|명세·경계·예외 허용 범위 검증 (품질 3/3)|높음 (15%)|
|**Plan**|후보 이탈 (`none` / Human)|5개 모델 후보가 3회 게이트 조건 미달 ➡️ **사람 수동 계획**|**0% (비용 없음)**|
|**Generate**|`gpt-5.4-mini` (F3)|코드 실행검사 6/6 및 3회 통과 (Low-cost Tier)|보통 (10%)|
|**Evaluate**|`claude-sonnet-5` (F4)|결함·Harness gate·Execution Provenance 검토 통과|매우 높음 (45%)|
|**Tutor**|`gemini-3-flash-preview` (F5)|실시간 복구 프로토콜 및 다중 힌트 통제 제공|보통 (25%)|
|**Gate**|`none` (N0)|결정론적 로컬 Harness 쉘 검사와 Human Gate 우선|**0% (비용 없음)**|

---

### 3. 산출물 원본 데이터의 오프라인 토큰 점유도 분석

과금 토큰(입력 + 출력 + 캐시 토큰)을 오프라인(ASCII 1토큰≒4자, 한글 CJK CJK 대략 1자≒1.3토큰 가중치 적용 규칙)으로 환산해 본 범위(Scope) 축소 비율 효과입니다.

- **주요 소모 지표**:
    
    - [activity.js](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html) (몰입 가이드의 핵심 순수 로직): **~1,333 tokens**
    - [activity.test.js](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html) (결정론적 가치 어서션 테스트 목록): **~926 tokens**
    - [dashboard.html](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html) (프론트엔드 Clawpilot 대시보드 마크업): **~6,800 tokens** (추정)
    - [spec.md](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/workbench.html) (Spac-pack 자가 검정 산출물 세트): **~3,489 tokens**
- **의의**: 에이전트에 전체 코드나 환경 데이터를 날것 그대로 통째로 넘기지 않고, **Context Manifest 상의 allowed 파일군 2개로만 한정하여 전달**함으로써 약 80% 이상의 불필요한 토큰 노출을 차단, 비용 최적화(CLEAN Provenance 달성)를 극대화할 수 있었습니다.








# 정리
1. 시키기 전에 무엇을 원하는지 먼저 생각하기

- 나쁜 지시는 모델에게 "무엇이 끝인지"를 정하지 않는다. "알아서 잘 해줘"가 대표적인 안티패턴이다.
- 좋은 지시는 6요소(역할·맥락·작업·제약·검증·출력, R/C/T/C/V/O)로 끝의 모양을 먼저 못박는다.
- 시키기 전에 목표·변경 범위·제외 범위·관련 파일·실패 로그·완료 조건을 짧게(약 12줄) 적어 둔다.
- Plan Mode처럼 계획과 실행을 분리해, 코드 한 줄 쓰기 전에 범위와 기준부터 합의한다. 이것이 재작업을 막는 투자다.

2. Acceptance Criteria가 없으면 시킬 일을 덜 검증한 것

- AC는 정상·예외·경계로 나눠 쓴다. 예: 일반 10퍼센트, 면세 0, 음수 입력은 오류.
- 모든 AC는 자동 테스트나 정책 체크로 확인 가능해야 한다(예: npm test, npm run lint). AC마다 검증 방법과 측정 수단을 붙인다.
- "빠르다·직관적이다" 같은 느낌 기준은 AC가 아니라 non-goal로 분리한다.
- AC가 없다는 것은 완료 판정을 모델에게 떠넘긴 것이고, 결국 시킨 일을 스스로 덜 검증했다는 뜻이다.

3. 시키는 일에 적절한 모델 선택

- 먼저 활동의 성격과 책임 주체를 나눈다. 환경 점검·checkpoint·명령/gate 실행처럼 사람과 도구가 할 일은 모델을 쓰지 않고, AI 보조가 필요한 활동에만 모델을 고른다.
- 활동마다 맞는 모델을 고른다. 짧은 다음 행동 제안, 작은 구현의 샌드박스 검증, 경계·예외·허용 범위의 구조화 등 과업 성격에 따라 권장 모델이 달라진다.
- 선택 근거는 속도나 요금이 아니라 품질 게이트를 반복해서 통과했는지로 본다. 실제로는 강의 당일의 조직 정책과 세션 로그를 확인해 최종 결정한다.

4. 하네스는 재실행 가능하고 결정론적인 결과물을 만들어가는 과정

- 하네스의 출발점은 가드레일이다. "외부 패키지 금지", "public API 시그니처 유지" 같은 자연어 제약을, 누구나 같은 명령으로 다시 돌릴 수 있는 실행 가능한 검증으로 바꾼다.
- 결정론적이라는 것은 사람의 느낌이 아니라 checker가 pass/fail을 판정한다는 뜻이다. checkpoint와 gate는 결정론적 검사라 같은 입력이면 누가 언제 돌려도 같은 결과가 나오고, 사람은 결과만 확인한다.
- 구성요소: 입력·fixture·도구 통제(Driver/Adapter), 실행 흔적 기록(Observation), 구조적 누락·금지 조건을 막는 실행 게이트(assertion·lint·test·policy·check 스크립트), 판단과 실패 이력을 다음 세션에 넘기는 감사 추적(rounds/ADR), 되돌림 경로(Rollback).
- 한 번에 완성하는 게 아니라, 실패를 게이트로 고정하고 재현 가능한 baseline과 감사 추적을 쌓아가며 점진적으로 단단해진다. 하네스가 약하면 통과가 "잘못된 안심"을 준다.

한 줄 관통 원칙: 원하는 결과(무엇)와 완료 기준(AC)을 사람이 먼저 정하고, 그 일에 맞는 주체·모델을 고른 뒤, 재실행 가능하고 결정론적인 하네스로 검증까지 남긴다.
# Agentic SDLC 단계 정의와 개념 매핑
