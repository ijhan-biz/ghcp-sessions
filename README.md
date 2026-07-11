# GitHub Copilot 중급과정 — 세션별 교육 콘텐츠 (ghcp-sessions)

GitHub Copilot Handson **중급과정(2일·16시간)** 을 **시간(세션) 단위**로 풀어 쓴 교육 콘텐츠입니다.
재편안(2026-06-27)의 세션 구조에 맞춰 Day1 S0~S6, Day2 S0~S7의 **각 시간마다 독립된 레슨**(학습목표·미니강의·실습·예제·체크포인트·산출물·공유 활동)을 담았습니다.

> 수강 후 목표: 에이전트를 활용해 **자신만의 재사용 솔루션**(Custom Skill/Agent + Fleet/Loop)을 만들고, 그 **경험을 팀에 공유**할 수 있는 역량.
>
> 결과물 검증 기준(페르소나·바라는 점·전달 내용·검증 목표)은 [`learning-objectives.html#frame`](learning-objectives.html#frame) 에 정의되어 있으며, 모든 세션은 이 목적을 기준으로 판단합니다.

## 사전설치 (참가자용)

교육 전, 본인 OS에 맞는 스크립트를 **프로젝트 루트**에서 실행하세요. **Dev Container/Docker 없이** 현재 터미널의 개발 환경을 점검하고 누락/구버전을 **자동으로 바로잡은 뒤**, 실습 코드를 실제로 돌려 **준비 완료(READY)** 여부를 판정합니다.

**macOS** (Homebrew 사용)
```sh
bash setup-mac.sh            # 점검 + 자동 교정(누락 설치 / Node 18+ 업그레이드)
bash setup-mac.sh --check    # 교정 없이 점검만
```

**Windows** (명령 프롬프트 cmd · winget 사용)
```bat
setup-windows.bat            REM 점검 + 자동 교정
setup-windows.bat --check    REM 교정 없이 점검만
```

설치/점검 대상:

| 도구 | 필수? | 없을 때 |
| --- | --- | --- |
| Node 18+ | **필수** | 스크립트가 자동 설치/업그레이드 |
| git | **필수** | 스크립트가 자동 설치 |
| VS Code (+ Copilot·Copilot Chat 확장) | 권장 | — |

스크립트는 마지막에 Day1 `labs`와 Day2 폴백 `sample-project-activity-log` 테스트를 모두 실행합니다. 출력에 각각 **`10 pass / 2 skip / 0 fail`**, **`5 pass / 2 skip / 0 fail`** 과 **`READY ✅`** 가 보이면 이틀 실습 준비 완료입니다.

> 사내 정책상 Homebrew/winget 자동 설치가 막혀 있으면, 위 표의 도구를 수동 설치한 뒤 `--check`(mac) / `--check`(Windows cmd) 로 점검만 수행하세요. 모델 호출·과금 정책은 조직 테넌트마다 다르므로 공식 Usage/정책을 확인하고, 수업의 하네스·장기 실행 데모는 로컬 결정론 스크립트(`npm run sim`, `npm run routing`)를 기본으로 사용합니다.

## 구성

```
ghcp-sessions/
  docs/    설명(HTML) — 세션별 강의 콘텐츠
  labs/    실행 코드 — 직접 실행하며 이해하는 실습(zero-dependency Node)
```

| 경로 | 내용 |
| --- | --- |
| `docs/index.html` | 포탈 — 전체 세션 맵, 실습 코드 안내, 참조 자료 반영표 |
| `docs/d1-s0.html` ~ `d1-s6.html` | Day 1 — 환경 점검 → 토큰·가드레일 → 좋은 프롬프트(1)(2) → Plan Mode → 종합 미니랩 → QnA |
| `docs/d2-s0.html` ~ `d2-s7.html` | Day 2 — 복습 → 하네스 기초 → Agent Teams·Fleet·Loop → 본인 워크플로 → SDD(1)(2) → Custom Skill/Agent → 경험 공유 |
| `docs/ag-ui-program.css` | 공통 테마(AG-UI inspired) |
| `labs/` | 세션별 실행 코드 + 템플릿(상세: `labs/README.md`) |
| `sample-project-activity-log/` | **전원 공통 실습 프로젝트** — activity-log/sessionize, 16개 checkpoint |
| `sample-project-activity-log/SELF-PACED-LAB.html` | **45명·강사 1인용 따라하기** — 일반 hint/reset, D2·S4 GREEN 전용 recover |
| `sample-project-plans/` | **완성본 레퍼런스** — 강의 전 과정을 끝까지 채운 예시(Trello 유형 칸반 엔진, 테스트 전부 green) |

## 보기 (설명)

각 HTML은 정적 파일입니다. 브라우저로 `docs/index.html`을 엽니다.

```sh
open docs/index.html        # macOS
# 또는 간단한 로컬 서버
python3 -m http.server 8080 # 이후 http://localhost:8080/docs/
```

## 실행 (실습 코드)

의존성 없이 **Node 18+ 내장 도구**만으로 동작합니다.

```sh
cd labs
npm test          # Day1 설명 예제 baseline: 10 pass, 2 skip(선택형 SDD 미니 예제)
npm run gate      # lint + test + policy-check
npm run sim       # 장기 실행 안전장치 시뮬레이션
npm run routing   # 단계별 모델 라우팅 데모
```

> 두 코드베이스: `labs/` billing은 Day1 설명 데모(10/2), 전원이 작성·검증받는 16개 checkpoint와 Day2 구현은 `sample-project-activity-log/`(5/2→7/0)입니다. 개인 코드 적용은 공통 GREEN 후 선택하거나 D+7로 보냅니다.
>
> 완성본 레퍼런스: `sample-project-plans/`(Trello 유형 칸반 엔진)는 스펙→하네스→게이트→SDD 구현→커스텀 스킬/에이전트까지 **끝까지 완성한** 예시입니다. "실습이 완성되면 이런 모습"을 보여줄 때 사용하세요. `cd sample-project-plans && npm test`(전부 green), `npm start`(웹 서비스).

## 특징

- **용어 일관성**: 도메인 용어사전 ID(`CF/HE/SD/PT/EN/OR/EV/GN`)를 각 세션에 인라인 태그로 인용.
- **근거 기반 심화**: 각 세션의 "참조 심화" 블록은 1차 자료(`ref/harness-gen-output`의 004 실행 하네스 원칙 · 005 Agent Team · 028 Agentic SDLC · 031 AI-assisted SDLC · 033 Long-Running · 035 Model Routing)의 구체 패턴을 반영.
- **로컬 전용 전제**: 실습은 개인 로컬 VS Code + 로컬 Git + 로컬 검증 게이트 기준(Codespaces·GitHub PR/Actions 미사용).

## 주의

- 제품 기능·Agent 도구/설정·모델명·가격은 시점에 따라 바뀝니다. 운영 전 공식 문서·테넌트 설정으로 재확인하세요(release-time recheck).
- 콘텐츠에는 고객정보·키/토큰·운영 로그 원문을 포함하지 않습니다(교육용 비식별 전제).

---

재편안 기반 · 작성: 한익준 (Microsoft)
