@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
set "BUN_EXE="
set "NODE_EXE="
set "UPSTREAM_FAILED="
set "UPSTREAM_SKIPPED="
set "INSTALL_EXIT=0"
set "NO_PAUSE="
set "DRY_RUN="
set "FORWARD_ARGS="
set "HAS_GIT_REPO="
set "INSTALL_ARGS=--no-pause --require-build"

:parse_args
if "%~1"=="" goto args_done
if /I "%~1"=="--no-pause" (
  set "NO_PAUSE=1"
  shift
  goto parse_args
)
if /I "%~1"=="--dry-run" (
  set "DRY_RUN=1"
)
set "FORWARD_ARGS=%FORWARD_ARGS% %~1"
shift
goto parse_args

:args_done

pushd "%SCRIPT_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Could not open the project directory.
  goto finish_error
)

echo.
echo [1/4] Detecting update mode...
if exist ".git" (
  set "HAS_GIT_REPO=1"
)

if defined HAS_GIT_REPO (
  echo [INFO] Git repository detected. Upstream rebase/update is available.

  where bun >nul 2>&1
  if not errorlevel 1 (
    set "BUN_EXE=bun"
  )
  if not defined BUN_EXE if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set "BUN_EXE=%USERPROFILE%\.bun\bin\bun.exe"
  )

  where node >nul 2>&1
  if not errorlevel 1 (
    set "NODE_EXE=node"
  )

  if not defined BUN_EXE if not defined NODE_EXE (
    echo [ERROR] Neither Bun nor Node.js is available.
    echo Install Bun or Node.js, then run this script again.
    goto finish_error
  )

  echo [2/4] Trying to update the custom branch from upstream...
  if defined BUN_EXE (
    call "%BUN_EXE%" scripts\update-from-upstream.mjs %FORWARD_ARGS%
    if errorlevel 1 (
      set "UPSTREAM_FAILED=1"
      echo [WARN] Upstream update did not complete cleanly.
      echo [WARN] Continuing with a rebuild/install of the current local custom branch.
    )
  ) else (
    call "%NODE_EXE%" scripts/update-from-upstream.mjs %FORWARD_ARGS%
    if errorlevel 1 (
      set "UPSTREAM_FAILED=1"
      echo [WARN] Upstream update did not complete cleanly.
      echo [WARN] Continuing with a rebuild/install of the current local custom branch.
    )
  )
) else (
  echo [INFO] No .git repository was found in this folder.
  echo [INFO] This looks like a GitHub ZIP extract, so upstream rebase/update is not available here.
  echo [INFO] The script will refresh the current local custom build instead.
  set "UPSTREAM_SKIPPED=1"
  set "INSTALL_ARGS=--no-pause"
  echo [2/4] Skipping upstream rebase/update...
)

if defined DRY_RUN (
  echo [3/4] Dry run requested. Skipping rebuild/install.
  goto done
)

echo [3/4] Rebuilding and reinstalling the local custom extension...
echo [INFO] The installer will verify Bun and automatically run "bun install" if this copy is missing dependencies.
call "%SCRIPT_DIR%install-spicy-lyrics.bat" %INSTALL_ARGS%
set "INSTALL_EXIT=%ERRORLEVEL%"
if not "%INSTALL_EXIT%"=="0" (
  echo [ERROR] Local install/apply failed.
  echo [ERROR] If the upstream patch applied correctly, the most likely cause is a local build/bootstrap problem shown above.
  goto finish_error
)

:done
echo [4/4] Done.
if defined DRY_RUN (
  if defined UPSTREAM_SKIPPED (
    echo [INFO] Dry run finished. This ZIP copy cannot rebase from upstream because it is not a git clone.
  ) else if defined UPSTREAM_FAILED (
    echo [INFO] Dry run finished, but the upstream update check reported issues that need manual attention.
  ) else (
    echo [INFO] Dry run finished. No files were rebuilt or applied.
  )
) else if defined UPSTREAM_SKIPPED (
  echo [INFO] Upstream rebase/update was skipped because this folder is a ZIP extract, not a git clone.
  echo [INFO] The current local custom build was refreshed and applied successfully.
) else if defined UPSTREAM_FAILED (
  echo [INFO] The local custom build was refreshed, but the upstream rebase/update step needs manual attention.
) else (
  echo [INFO] Upstream update, rebuild, local install, and Spicetify apply completed.
)
goto finish_success

:finish_error
set "EXIT_CODE=1"
goto finish

:finish_success
set "EXIT_CODE=0"

:finish
popd >nul
echo.
if not defined NO_PAUSE (
  pause
)
exit /b %EXIT_CODE%
