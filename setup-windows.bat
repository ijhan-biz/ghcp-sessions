@echo off
chcp 65001 >nul 2>nul
setlocal enabledelayedexpansion
REM ============================================================
REM  GitHub Copilot 중급과정 — Windows(cmd) 환경 점검 & 자동 교정
REM
REM  Dev Container/Docker 없이, "현재 명령 프롬프트(host)"의 개발 환경이
REM  정상인지 점검하고 누락/구버전을 자동으로 바로잡습니다. 마지막에 실습
REM  코드(labs)를 실제로 실행해 "수강 준비 완료(READY)" 여부를 판정합니다.
REM
REM  사용법:
REM    setup-windows.bat            점검 + 자동 교정(누락 설치 / Node 18+ 업그레이드)
REM    setup-windows.bat --check    교정 없이 점검만
REM ============================================================

set "CHECK_ONLY=0"
if /I "%~1"=="--check" set "CHECK_ONLY=1"
if /I "%~1"=="-check"  set "CHECK_ONLY=1"
if /I "%~1"=="/check"  set "CHECK_ONLY=1"
if /I "%~1"=="check"   set "CHECK_ONLY=1"

cd /d "%~dp0"

echo == GitHub Copilot 중급과정 — 환경 점검 ^& 자동 교정 (Windows/cmd) ==
if "%CHECK_ONLY%"=="1" (echo (check-only: 교정 없이 점검만)) else (echo (누락/구버전은 winget으로 자동 교정합니다))

REM ---------------------------------------------------------------- 자동 교정 단계
if "%CHECK_ONLY%"=="0" (
  where winget >nul 2>nul
  if errorlevel 1 (
    echo   [!] winget 미설치 — Microsoft Store 의 'App Installer' 설치 후 다시 실행하세요.
  ) else (
    call :ensure git  Git.Git
    call :ensure node OpenJS.NodeJS.LTS
    call :ensure gh   GitHub.cli
    call :ensure code Microsoft.VisualStudioCode

    REM Node 18+ 보장(구버전이면 업그레이드)
    where node >nul 2>nul
    if not errorlevel 1 (
      for /f "tokens=1 delims=." %%v in ('node -v') do set "NMAJ=%%v"
      set "NMAJ=!NMAJ:v=!"
      if !NMAJ! LSS 18 (
        echo   [..] Node !NMAJ!.x 구버전 — 18+ 로 업그레이드
        winget upgrade -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
      )
    )
  )

  REM gh copilot CLI 확장 (best effort)
  where gh >nul 2>nul
  if not errorlevel 1 (
    gh extension list 2>nul | findstr /I "gh-copilot" >nul
    if errorlevel 1 gh extension install github/gh-copilot 2>nul
  )

  REM VS Code 확장 (Copilot / Copilot Chat)
  where code >nul 2>nul
  if not errorlevel 1 (
    call :ensureext GitHub.copilot
    call :ensureext GitHub.copilot-chat
  )
)

REM ---------------------------------------------------------------- 점검 단계
echo.
echo == 환경 점검 ==
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
    echo   [x] Node !NMAJ!.x ^(18+ 필요 — '--check' 없이 다시 실행하면 자동 업그레이드^)
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

where gh >nul 2>nul && (echo   [ok] gh CLI) || (echo   [!] gh CLI 미설치 ^(Copilot Chat 으로 대체 가능^))
where gh >nul 2>nul
if not errorlevel 1 (
  gh auth status >nul 2>nul
  if errorlevel 1 (echo   [!] gh 미인증 — gh auth login 실행 필요) else (echo   [ok] gh 인증됨)
)
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
  echo 결과: NOT READY - 위 [x] 항목을 해결한 뒤(또는 '--check' 없이 재실행) 다시 확인하세요.
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
