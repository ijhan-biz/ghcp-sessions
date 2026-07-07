# sample-project-sns-trends — 폴백 실습 프로젝트 (대안 도메인)

**유명 SNS 트렌드 분석 엔진.** 본인 기능을 못 가져온 참가자가 "내 기능"처럼 채택해
Day1~Day2 전 과정을 진행하는 **폴백 실습 프로젝트**입니다. 의존성 없이 Node 18+ 로 동작합니다.

> **설계 경계:** 실제 SNS API 호출(검색)은 **주입 가능한 `fetch`로 분리**합니다(네트워크·API 키·비결정성 → 테스트 곤란).
> 테스트에서는 **fake fetcher**를 주입해 결정론적으로 검증하고, 해시태그 추출·점수·랭킹은 **순수 로직**으로 둡니다.

## 시작
```sh
cd sample-project-sns-trends
npm test        # baseline: 9 pass, 2 skip(Day2-S4에서 켤 테스트)
```

## 실습 스크립트 (Day1~Day2)
의존성 없이 Node 18+ 내장 도구로 동작합니다. **VS Code 새 창**에 이 폴더를 열고(참가자 문서 D2·S0 참고) 통합 터미널에서 실행하세요.

| 명령 | 용도 | 세션 |
| --- | --- | --- |
| `npm test` | 유닛테스트(node --test) | 전체 |
| `npm run demo` | 데모 CLI 직접 실행(내장 fake fetcher, 예: `npm run demo -- "#ai" --topN=3`) | 직접 체험 |
| `npm run serve` | 웹 화면(브라우저)에서 트렌드+인사이트 보기 → `http://127.0.0.1:3000` | 직접 체험 |
| `npm run env` | 환경 준비도 점검(Green/Yellow/Red) | D2·S0 |
| `npm run spec-check` | '좋은 입력' 스펙 자가검증 | D1·S5 |
| `node scripts/token-estimate.mjs <파일...>` | 입력 토큰 근사치 | D1·S1 |
| `npm run lint` · `npm run policy-check` · `npm run gate` | 로컬 품질 게이트 | D2·S2 |
| `npm run sim` | 장기 실행 안전장치 시뮬레이션 | D2·S3 |
| `npm run packet` | 로컬 리뷰 패킷 생성 | D2·S5·S7 |
| `npm run routing` | 단계별 모델 라우팅 데모 | D2·S6 |

## 실시간 웹 검색 · 인사이트(옵트인)

기본 실행(`npm run serve`)은 **실제 SNS 데이터**를 씁니다: **Bluesky 공개 검색 API**(api.bsky.app, 키워드 검색, 키·OAuth 불필요) + 빈 검색어(전체)는 **안전 주제어 개요**. 모두 공개 읽기 API로 **스크래핑이 아닙니다**.
태그 나열은 항상 **실제 검색 결과 기반**이며, 실데이터 소스가 있으면 결과가 비어도 **샘플로 대체하지 않습니다**. 내장 샘플은 `FORCE_SAMPLE=1`(오프라인 데모)일 때만. 유닛테스트/게이트는 주입형 fake fetch만 써서 항상 결정론입니다.

### 스냅샷(오프라인·독립 실행)
현재 실데이터를 파일로 저장해 **네트워크 없이 동일하게 재현**할 수 있습니다.

```sh
npm run snapshot                    # 현재 실데이터를 루트 snapshot.json 으로 저장(안전 필터 적용)
$env:USE_SNAPSHOT="1"; npm run serve  # 저장된 snapshot.json 으로 오프라인 실행(네트워크 불필요)
```

```sh
npm run serve                       # 기본: Bluesky(키워드)+안전주제어(전체) · 최근 3개월 · 한국어 · 한글 태그만
$env:SOURCE="mastodon"              # (선택) 키워드 검색도 Mastodon으로
$env:SOURCE="bluesky"               # (선택·기본) 키워드 검색은 Bluesky 공개 API
$env:WINDOW_DAYS="90"; $env:MAX_COLLECT="3000"    # (선택) 수집 기간(기본 90일=3개월)·최대 수집량
$env:LANGS="ko"; $env:TAG_SCRIPT="hangul"          # (선택) 수집 언어(기본 ko) · 태그 종류(hangul=한글만, any=전체)
$env:CACHE_TTL_MS="300000"                        # (선택) 동일 쿼리 캐시 유지시간(ms, 기본 5분)
$env:FORCE_SAMPLE="1"; npm run serve              # 강제로 샘플만(오프라인 데모)
```

아래 환경변수를 설정하면 **다른 실데이터/AI 경로**를 쓸 수 있습니다(키는 리포지토리에 저장 금지, env로만).

```sh
# (선택) 실제 웹 검색 수집(예: Brave Search 호환) — 설정 시 Mastodon 대신 사용
$env:WEB_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search"
$env:WEB_SEARCH_API_KEY  = "<발급받은 키 — 커밋 금지>"
# (선택) 인증 헤더명 변경: 기본 X-Subscription-Token (Bing이면 Ocp-Apim-Subscription-Key)

# (선택) 키워드 인사이트를 GitHub Copilot(GitHub Models, OpenAI 호환)로 생성
$env:GITHUB_TOKEN     = "<토큰 — 커밋 금지>"
$env:INSIGHT_ENDPOINT = "https://models.inference.ai.azure.com/chat/completions"
$env:INSIGHT_MODEL    = "gpt-4o-mini"

npm run serve   # 화면 상단 배지로 '실시간 Mastodon/웹' · 인사이트 출처(AI) 표시
```

> 주의: 지역·연령 세그먼트는 공개 SNS 데이터에 없어 실데이터에서는 비어 보일 수 있습니다(샘플 데이터에만 포함). 외부 키/LLM은 원래 스펙의 non-goal이라 **옵트인**이며, 실배포 시 rate limit·비용·롤백 책임자를 확인하세요.

## 이렇게 진행하세요
1. `FEATURE-SPEC.md` 를 "내 기능 스펙 카드"로 채택 (D1·S1)
2. `BACKLOG.md` 에서 slice 1개 선택 (권장 #1: 최근성 가중 `recencyWeight`)
3. **D1**: User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
4. **D2**: 하네스·게이트(S1~S3) → test-first 로 `test/trends.test.js` 의 `skip` 해제 → `src/trends.js` 의 `recencyWeight` 구현(S4~S5) → Custom Skill(S6) → 공유(S7)
5. 정답 비교: `src/trends.solution.js`

## 파일
| 파일 | 용도 |
| --- | --- |
| `FEATURE-SPEC.md` | 비식별 기능 스펙 카드(참가자가 채택) |
| `BACKLOG.md` | slice 후보(하나 골라 진행) |
| `src/trends.js` | 대상 코드(`recencyWeight` = TODO) |
| `test/trends.test.js` | 통과 9 + skip 2(구현 대상) |
| `src/trends.solution.js` | 참고 정답(`recencyWeight` 구현 예) |
