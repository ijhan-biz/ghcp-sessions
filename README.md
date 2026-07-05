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
| gh CLI (+ `gh-copilot`) | 권장 | Copilot Chat 으로 대체 |
| VS Code (+ Copilot·Copilot Chat 확장) | 권장 | — |

스크립트는 마지막에 `labs` 테스트(`npm test`)를 실행합니다. 출력에 **`# pass 10` / `# skipped 2` / `# fail 0`** 와 **`READY ✅`** 가 보이면 수강 준비 완료입니다.

> 사내 정책상 Homebrew/winget 자동 설치가 막혀 있으면, 위 표의 도구를 수동 설치한 뒤 `--check`(mac) / `--check`(Windows cmd) 로 점검만 수행하세요. gh copilot 라이브 호출은 AI Credits(토큰 기반, 2026-06-01~)를 소비하므로, 수업 중에는 하네스 래퍼의 dry-run을 기본으로 사용합니다.

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
| `docs/d2-s0.html` ~ `d2-s7.html` | Day 2 — 복습 → 하네스·CLI → Agent Teams·Fleet·Loop → 본인 워크플로 → SDD(1)(2) → Custom Skill/Agent → 경험 공유 |
| `docs/ag-ui-program.css` | 공통 테마(AG-UI inspired) |
| `labs/` | 세션별 실행 코드 + 템플릿(상세: `labs/README.md`) |
| `sample-project-sns-trends/` | 폴백 실습 프로젝트 — 본인 기능 미지참 시 채택(유명 SNS 트렌드 분석 엔진) |

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
npm test          # baseline: 10 pass, 2 skip(Day2-S4에서 켜서 구현)
npm run gate      # lint + test + policy-check
npm run sim       # 장기 실행 안전장치 시뮬레이션
npm run routing   # 단계별 모델 라우팅 데모
```

> 두 코드베이스: **Day1**은 결제(billing) 예제(`labs/` — `src/billing/tax.js`·`discount.js`)로 기법을 익히고, **Day2**는 실습 프로젝트를 **VS Code 새 창**에 열어 구현합니다. 세션↔코드 지도는 각 프로젝트의 `README.md`.
>
> Day2 실습 프로젝트(폴백): 본인 기능을 못 가져온 참가자는 `sample-project-sns-trends/`(유명 SNS 트렌드 분석 엔진)를 "내 기능"으로 채택해 새 창에서 진행합니다 — `cd sample-project-sns-trends && npm test` (baseline 9 pass, 2 skip).

## 특징

- **용어 일관성**: 도메인 용어사전 ID(`CF/HE/SD/PT/EN/OR/EV/GN`)를 각 세션에 인라인 태그로 인용.
- **근거 기반 심화**: 각 세션의 "참조 심화" 블록은 1차 자료(`ref/harness-gen-output`의 004 CLI 하네스 · 005 Agent Team · 028 Agentic SDLC · 031 AI-assisted SDLC · 033 Long-Running · 035 Model Routing)의 구체 패턴을 반영.
- **로컬 전용 전제**: 실습은 개인 로컬 VS Code + 로컬 Git + 로컬 검증 게이트 기준(Codespaces·GitHub PR/Actions 미사용).

## 주의

- 제품 기능·CLI 옵션·모델명·가격은 시점에 따라 바뀝니다. 운영 전 공식 문서·테넌트 설정으로 재확인하세요(release-time recheck).
- 콘텐츠에는 고객정보·키/토큰·운영 로그 원문을 포함하지 않습니다(교육용 비식별 전제).

---

재편안 기반 · 작성: 한익준 (Microsoft)
