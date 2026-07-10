@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>nul

REM ============================================================
REM GitHub Copilot Intermediate Course - Windows cmd setup helper
REM
REM Checks host environment, auto-fixes missing tools and old Node,
REM then runs Day1 labs and Day2 activity-log tests to verify readiness.
REM
REM Usage:
REM   setup-windows.bat           Check + auto-fix
REM   setup-windows.bat --check   Check only (no changes)
REM ============================================================

set "CHECK_ONLY=0"
if /I "%~1"=="--check" set "CHECK_ONLY=1"
if /I "%~1"=="-check"  set "CHECK_ONLY=1"
if /I "%~1"=="/check"  set "CHECK_ONLY=1"
if /I "%~1"=="check"   set "CHECK_ONLY=1"

cd /d "%~dp0"

echo == GitHub Copilot Intermediate - Environment Check ^& Auto-Fix (Windows/cmd) ==
if "%CHECK_ONLY%"=="1" (
  echo check-only mode: no installation or upgrade will run
) else (
  echo auto-fix mode: missing tools or old versions may be installed/upgraded with winget
)

REM ---------------------------------------------------------------- Auto-fix phase
if "%CHECK_ONLY%"=="0" (
  where winget >nul 2>nul
  if errorlevel 1 (
    echo   [!] winget is not available. Install App Installer from Microsoft Store, then retry.
  ) else (
    call :ensure git  Git.Git
    call :ensure_node
    call :ensure code Microsoft.VisualStudioCode

    REM Ensure Node major version is 18+
    call :refresh_node_path
    call :persist_node_path
    where node >nul 2>nul
    if not errorlevel 1 (
      for /f "tokens=1 delims=." %%v in ('node -v') do set "NMAJ=%%v"
      set "NMAJ=!NMAJ:v=!"
      if !NMAJ! LSS 18 (
        echo   [..] Node !NMAJ!.x detected. Upgrading to Node 18+.
        winget upgrade -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        call :refresh_node_path
        call :persist_node_path
      )
    )
  )

  REM Ensure VS Code extensions (Copilot / Copilot Chat)
  where code >nul 2>nul
  if not errorlevel 1 (
    call :ensureext GitHub.copilot
    call :ensureext GitHub.copilot-chat
  )
)

REM ---------------------------------------------------------------- Validation phase
echo.
echo == Environment Validation ==
set "PASS=1"

call :refresh_node_path
call :persist_node_path
where node >nul 2>nul
if errorlevel 1 (
  echo   [x] Node is missing - required
  set "PASS=0"
) else (
  for /f "tokens=1 delims=." %%v in ('node -v') do set "NMAJ=%%v"
  set "NMAJ=!NMAJ:v=!"
  if !NMAJ! GEQ 18 (
    echo   [ok] Node !NMAJ!.x
  ) else (
    echo   [x] Node !NMAJ!.x found - Node 18+ required. Re-run without --check for auto-upgrade.
    set "PASS=0"
  )
)

where git >nul 2>nul
if errorlevel 1 (
  echo   [x] git is missing - required
  set "PASS=0"
) else (
  echo   [ok] git
)

where code >nul 2>nul
if errorlevel 1 (
  echo   [!] VS Code code CLI not found - GUI installation alone is still fine
) else (
  echo   [ok] VS Code code CLI
)

REM ---------------------------------------------------------------- Course smoke tests
echo.
echo == Course Test Run: Day1 labs + Day2 activity-log ==
if not exist "labs\package.json" (
  echo   [!] labs\package.json not found - skipping labs test
  set "PASS=0"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo   [!] Node missing - skipping labs test
  ) else (
    pushd labs
    call npm test
    set "TESTCODE=!errorlevel!"
    popd
    if "!TESTCODE!"=="0" (
      echo   [ok] labs tests passed - ready for hands-on work
    ) else (
      echo   [x] labs tests failed - review test output
      set "PASS=0"
    )
  )
)

if not exist "sample-project-activity-log\package.json" (
  echo   [x] sample-project-activity-log\package.json not found
  set "PASS=0"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo   [x] Node missing - skipping activity-log test
    set "PASS=0"
  ) else (
    pushd sample-project-activity-log
    call npm test
    set "ACTIVITYCODE=!errorlevel!"
    popd
    if "!ACTIVITYCODE!"=="0" (
      echo   [ok] activity-log tests passed - Day2 fallback ready
    ) else (
      echo   [x] activity-log tests failed - review test output
      set "PASS=0"
    )
  )
)

echo.
if "%PASS%"=="1" (
  echo Result: READY - You can start the training labs.
  call :leave 0
) else (
  echo Result: NOT READY - Resolve [x] items and re-run setup-windows.bat or use --check again.
  call :leave 1
)

REM ---------------------------------------------------------------- Subroutines
:leave
set "EXITCODE=%~1"
set "FINALPATH=%PATH%"
endlocal & set "PATH=%FINALPATH%" & exit /b %EXITCODE%

:ensure_node
where node >nul 2>nul
if not errorlevel 1 (
  echo   [ok] Already installed: node
  goto :eof
)

echo   [..] Installing: OpenJS.NodeJS.LTS
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
call :refresh_node_path
call :persist_node_path
where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node install finished but node command is still not visible in this shell.
  echo       Open a new cmd window and run setup-windows.bat --check again.
) else (
  echo   [ok] Node command detected after install
)
goto :eof

:refresh_node_path
for %%P in ("%ProgramFiles%\nodejs" "%ProgramFiles(x86)%\nodejs" "%LocalAppData%\Programs\nodejs") do (
  if exist "%%~P\node.exe" (
    echo "!PATH!" | find /I "%%~P" >nul
    if errorlevel 1 set "PATH=%%~P;!PATH!"
  )
)
goto :eof

:persist_node_path
for %%P in ("%ProgramFiles%\nodejs" "%ProgramFiles(x86)%\nodejs" "%LocalAppData%\Programs\nodejs") do (
  if exist "%%~P\node.exe" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$nodePath='%%~P'; $userPath=[Environment]::GetEnvironmentVariable('Path','User'); if ([string]::IsNullOrWhiteSpace($userPath)) { $userPath=$nodePath } elseif ($userPath -notmatch [Regex]::Escape($nodePath)) { $userPath=$userPath.TrimEnd(';') + ';' + $nodePath }; [Environment]::SetEnvironmentVariable('Path',$userPath,'User')" >nul 2>nul
  )
)
goto :eof

:ensure
REM %1 = command to check, %2 = winget package id
where %1 >nul 2>nul
if errorlevel 1 (
  echo   [..] Installing: %2
  winget install -e --id %2 --accept-source-agreements --accept-package-agreements
) else (
  echo   [ok] Already installed: %1
)
goto :eof

:ensureext
REM %1 = VS Code extension id
code --list-extensions 2>nul | findstr /I /X "%1" >nul
if errorlevel 1 (
  code --install-extension %1 >nul 2>nul
)
goto :eof
