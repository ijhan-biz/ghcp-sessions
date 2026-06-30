@echo off
chcp 65001 >nul 2>nul
setlocal enabledelayedexpansion
REM ============================================================
REM  GitHub Copilot 중급과정 — Windows(cmd) 사전설치 & 준비도 점검
REM
REM  사용법(명령 프롬프트):
REM    setup-windows.cmd            누락 도구(winget) 설치 후 점검
REM    setup-windows.cmd --check    설치 없이 점검만(이미 설치된 환경 확인)
REM
REM  이미 설치된 도구는 건너뜁니다. 마지막에 실습 코드(labs)를 실제로
REM  실행해 "수강 준비 완료" 여부를 판정합니다.
REM ============================================================

set "CHECK_ONLY=0"
if /I "%~1"=="--check" set "CHECK_ONLY=1"
if /I "%~1"=="-check"  set "CHECK_ONLY=1"
if /I "%~1"=="/check"  set "CHECK_ONLY=1"
if /I "%~1"=="check"   set "CHECK_ONLY=1"

cd /d "%~dp0"

echo == GitHub Copilot 중급과정 사전설치 (Windows/cmd) ==
if "%CHECK_ONLY%"=="1" echo (check-only 모드: 설치 없이 점검만 수행)

REM ---------------------------------------------------------------- 설치 단계
if "%CHECK_ONLY%"=="0" (
  where winget >nul 2>nul
  if errorlevel 1 (
    echo   [!] winget 미설치 — Microsoft Store 의 'App Installer' 설치 후 다시 실행하세요.
  ) else (
    call :ensure git    Git.Git
    call :ensure node   OpenJS.NodeJS.LTS
    call :ensure gh     GitHub.cli
    call :ensure docker Docker.DockerDesktop
    call :ensure code   Microsoft.VisualStudioCode
  )

  REM gh copilot CLI 확장 (best effort)
  where gh >nul 2>nul
  if not errorlevel 1 (
    gh extension list 2>nul | findstr /I "gh-copilot" >nul
    if errorlevel 1 gh extension install github/gh-copilot 2>nul
  )

  REM VS Code 확장 (Copilot / Copilot Chat / Dev Containers)
  where code >nul 2>nul
  if not errorlevel 1 (
    call :ensureext GitHub.copilot
    call :ensureext GitHub.copilot-chat
    call :ensureext ms-vscode-remote.remote-containers
  )
)

REM ---------------------------------------------------------------- 점검 단계
echo.
echo == 준비도 점검 ==
set "PASS=1"

where node >nul 2>nul
if errorlevel 1 (
  echo   [x] Node 미설치 ^(필수^)
  set "PASS=0"
) else (
  for /f "tokens=1 delims=." %%v in ('node -v') do set "NMAJ=%%v"
  set "NMAJ=!NMAJ:v=!"
  if !NMAJ! GEQ 18 (
    echo   [ok] Node !NMAJ!.x
  ) else (
    echo   [x] Node !NMAJ!.x ^(18+ 필요^)
    set "PASS=0"
  )
)

where git >nul 2>nul
if errorlevel 1 (
  echo   [x] git 미설치 ^(필수^)
  set "PASS=0"
) else (
  echo   [ok] git
)

where gh >nul 2>nul && (echo   [ok] gh CLI) || (echo   [!] gh CLI 미설치 ^(Copilot Chat fallback 가능^))
where docker >nul 2>nul && (echo   [ok] Docker) || (echo   [!] Docker 미설치 ^(Host Node fallback 가능^))
where code >nul 2>nul && (echo   [ok] VS Code ^(code CLI^)) || (echo   [!] VS Code code CLI 미확인 ^(GUI만 있어도 무방^))

REM ---------------------------------------------------------------- 준비 완료 테스트(실습 코드 실행)
echo.
echo == 실습 코드 실행 테스트 (labs) ==
if not exist "labs\package.json" (
  echo   [!] labs\package.json 없음 — 건너뜀
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo   [!] Node 없음 — labs 테스트 건너뜀
  ) else (
    pushd labs
    call npm test
    set "TESTCODE=!errorlevel!"
    popd
    if "!TESTCODE!"=="0" (
      echo   [ok] labs 테스트 성공 — 실습 준비 완료
    ) else (
      echo   [x] labs 테스트 실패 — 출력 확인 필요
      set "PASS=0"
    )
  )
)

echo.
if "%PASS%"=="1" (
  echo 결과: READY - 교육 실습을 시작할 수 있습니다.
  endlocal & exit /b 0
) else (
  echo 결과: NOT READY - 위 [x] 항목을 해결한 뒤 다시 실행하세요.
  endlocal & exit /b 1
)

REM ---------------------------------------------------------------- 서브루틴
:ensure
REM %1 = 확인할 명령, %2 = winget 패키지 ID
where %1 >nul 2>nul
if errorlevel 1 (
  echo   [..] 설치: %2
  winget install -e --id %2 --accept-source-agreements --accept-package-agreements
) else (
  echo   [ok] 이미 설치됨: %1
)
goto :eof

:ensureext
REM %1 = VS Code 확장 ID
code --list-extensions 2>nul | findstr /I /X "%1" >nul
if errorlevel 1 (
  code --install-extension %1 >nul 2>nul
)
goto :eof
