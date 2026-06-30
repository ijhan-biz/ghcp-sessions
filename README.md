# GitHub Copilot 중급과정 — 세션별 교육 콘텐츠 (ghcp-sessions)

GitHub Copilot Handson **중급과정(2일·16시간)** 을 **시간(세션) 단위**로 풀어 쓴 교육 콘텐츠입니다.
재편안(2026-06-27)의 세션 구조에 맞춰 Day1 S0~S6, Day2 S0~S7의 **각 시간마다 독립된 레슨**(학습목표·미니강의·실습·예제·체크포인트·산출물·공유 활동)을 담았습니다.

> 수강 후 목표: 에이전트를 활용해 **자신만의 재사용 솔루션**(Custom Skill/Agent + Fleet/Loop)을 만들고, 그 **경험을 팀에 공유**할 수 있는 역량.

## 구성

| 파일 | 내용 |
| --- | --- |
| `index.html` | 포털 — 전체 세션 맵, 역량 빌드업 흐름, 참조 자료 반영표 |
| `d1-s0.html` ~ `d1-s6.html` | Day 1 — 환경 점검 → 토큰·가드레일 → 좋은 프롬프트(1)(2) → Plan Mode → 종합 미니랩 → QnA |
| `d2-s0.html` ~ `d2-s7.html` | Day 2 — 복습 → 하네스·CLI → Agent Teams·Fleet·Loop → 본인 워크플로 → SDD(1)(2) → Custom Skill/Agent → 경험 공유 |
| `ag-ui-program.css` | 공통 테마(AG-UI inspired) |

## 보기

각 HTML은 정적 파일입니다. 브라우저로 `index.html`을 열면 됩니다.

```sh
open index.html        # macOS
# 또는 간단한 로컬 서버
python3 -m http.server 8080
```

## 특징

- **용어 일관성**: 도메인 용어사전 ID(`CF/HE/SD/PT/EN/OR/EV/GN`)를 각 세션에 인라인 태그로 인용.
- **근거 기반 심화**: 각 세션의 "참조 심화" 블록은 1차 자료(`ref/harness-gen-output`의 004 CLI 하네스 · 005 Agent Team · 028 Agentic SDLC · 031 AI-assisted SDLC · 033 Long-Running · 035 Model Routing)의 구체 패턴을 반영.
- **로컬 전용 전제**: 실습은 개인 로컬 VS Code + 로컬 Git + 로컬 검증 게이트 기준(Codespaces·GitHub PR/Actions 미사용).

## 주의

- 제품 기능·CLI 옵션·모델명·가격은 시점에 따라 바뀝니다. 운영 전 공식 문서·테넌트 설정으로 재확인하세요(release-time recheck).
- 콘텐츠에는 고객정보·키/토큰·운영 로그 원문을 포함하지 않습니다(교육용 비식별 전제).

---

재편안 기반 · 작성: 한익준 (Microsoft)
