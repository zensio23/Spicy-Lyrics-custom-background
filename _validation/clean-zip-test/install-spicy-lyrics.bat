@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "DIST_FILE=%SCRIPT_DIR%dist\spicy-lyrics.js"
set "BRIDGE_FILE=%SCRIPT_DIR%builds\spicy-lyrics.mjs"
set "NODE_MODULES_DIR=%SCRIPT_DIR%node_modules"
set "CREATOR_ENTRY=%SCRIPT_DIR%node_modules\@spicemod\creator\dist\bin.mjs"
set "CREATOR_PACKAGE=%SCRIPT_DIR%node_modules\@spicemod\creator\package.json"
set "REACT_PACKAGE=%SCRIPT_DIR%node_modules\react\package.json"
set "KAWARP_PACKAGE=%SCRIPT_DIR%node_modules\@kawarp\core\package.json"
set "EXTENSION_FILE_JS=spicy-lyrics.js"
set "EXTENSION_FILE_MJS=spicy-lyrics.mjs"
set "SKIP_BUILD="
set "REQUIRE_BUILD="
set "NO_PAUSE="
set "BUN_EXE="

:parse_args
if "%~1"=="" goto args_done
if /I "%~1"=="--skip-build" (
  set "SKIP_BUILD=1"
  shift
  goto parse_args
)
if /I "%~1"=="--no-pause" (
  set "NO_PAUSE=1"
  shift
  goto parse_args
)
if /I "%~1"=="--require-build" (
  set "REQUIRE_BUILD=1"
  shift
  goto parse_args
)
shift
goto parse_args

:args_done

echo.
echo [1/6] Checking local tooling...

where spicetify >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Spicetify is not available on PATH.
  echo Install Spicetify first, then run this script again.
  goto finish_error
)

pushd "%SCRIPT_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Could not open the project directory.
  goto finish_error
)

where bun >nul 2>&1
if not errorlevel 1 (
  set "BUN_EXE=bun"
)
if not defined BUN_EXE if exist "%USERPROFILE%\.bun\bin\bun.exe" (
  set "BUN_EXE=%USERPROFILE%\.bun\bin\bun.exe"
)

if not defined SKIP_BUILD if exist "%SCRIPT_DIR%bun.lock" (
  echo [2/6] Checking project dependencies...
  if defined BUN_EXE (
    call :ensure_dependencies
    if errorlevel 1 goto finish_error

    echo [3/6] Building the latest Spicy Lyrics bundle...
    call :build_bundle
    if errorlevel 1 goto finish_error
  ) else (
    if defined REQUIRE_BUILD (
      echo [ERROR] Bun is required for this step but was not found.
      echo This script needs to rebuild Spicy Lyrics from source before installing it.
      echo Install Bun from https://bun.sh, then run this script again.
      goto finish_error
    )

    echo [INFO] Bun was not found.
    echo [INFO] The installer will use the bundled release files instead of rebuilding from source.
    echo [INFO] This is fine for a normal GitHub ZIP install. Install Bun later if you want to rebuild locally.
  )
)

echo [4/6] Validating local build artifacts...

if not exist "%DIST_FILE%" (
  echo [ERROR] Missing build artifact:
  echo         "%DIST_FILE%"
  if defined BUN_EXE (
    echo The installer could not find a finished bundle after the build step.
    echo Try running this script again. If the problem continues, delete node_modules and let the script repair dependencies again.
  ) else (
    echo This usually means the ZIP is incomplete or Bun was required but unavailable.
    echo Install Bun and run the installer again, or download a fresh release ZIP.
  )
  goto finish_error
)

if not exist "%BRIDGE_FILE%" (
  echo [ERROR] Missing local bridge loader:
  echo         "%BRIDGE_FILE%"
  goto finish_error
)

set "SPICETIFY_DIR="
for /f "usebackq delims=" %%I in (`spicetify path userdata 2^>nul`) do (
  set "SPICETIFY_DIR=%%I"
)

if not defined SPICETIFY_DIR (
  set "SPICETIFY_DIR=%APPDATA%\spicetify"
)

set "EXTENSIONS_DIR=%SPICETIFY_DIR%\Extensions"

if not exist "%EXTENSIONS_DIR%" (
  mkdir "%EXTENSIONS_DIR%"
  if errorlevel 1 (
    echo [ERROR] Could not create:
    echo         "%EXTENSIONS_DIR%"
    goto finish_error
  )
)

echo [5/6] Copying local custom build into Spicetify Extensions...
copy /Y "%DIST_FILE%" "%EXTENSIONS_DIR%\%EXTENSION_FILE_JS%" >nul
if errorlevel 1 (
  echo [ERROR] Failed to copy the extension into Spicetify.
  echo         Source: "%DIST_FILE%"
  echo         Target: "%EXTENSIONS_DIR%\%EXTENSION_FILE_JS%"
  goto finish_error
)

copy /Y "%BRIDGE_FILE%" "%EXTENSIONS_DIR%\%EXTENSION_FILE_MJS%" >nul
if errorlevel 1 (
  echo [ERROR] Failed to copy the local compatibility bridge into Spicetify.
  echo         Source: "%BRIDGE_FILE%"
  echo         Target: "%EXTENSIONS_DIR%\%EXTENSION_FILE_MJS%"
  goto finish_error
)

echo Registering %EXTENSION_FILE_JS% with Spicetify and disabling stale loaders...
spicetify config extensions %EXTENSION_FILE_MJS%- >nul 2>&1
spicetify config extensions %EXTENSION_FILE_JS%- >nul 2>&1
spicetify config extensions %EXTENSION_FILE_JS%
if errorlevel 1 (
  echo [ERROR] Failed to enable the extension in Spicetify config.
  goto finish_error
)

echo [6/6] Applying Spicetify...
spicetify apply
if errorlevel 1 (
  echo [ERROR] Spicetify apply failed.
  goto finish_error
)

echo.
echo Installed Spicy Lyrics successfully.
echo Active local extension: "%EXTENSIONS_DIR%\%EXTENSION_FILE_JS%"
echo Local compatibility bridge: "%EXTENSIONS_DIR%\%EXTENSION_FILE_MJS%"
goto finish_success

:finish_error
set "EXIT_CODE=1"
goto finish

:finish_success
set "EXIT_CODE=0"
goto finish

:ensure_dependencies
set "DEPENDENCIES_MISSING="
set "DEPENDENCY_REASON="

if not exist "%NODE_MODULES_DIR%\" (
  set "DEPENDENCIES_MISSING=1"
  set "DEPENDENCY_REASON=node_modules is missing"
)

if not defined DEPENDENCIES_MISSING if not exist "%CREATOR_PACKAGE%" (
  set "DEPENDENCIES_MISSING=1"
  set "DEPENDENCY_REASON=@spicemod/creator is missing"
)

if not defined DEPENDENCIES_MISSING if not exist "%REACT_PACKAGE%" (
  set "DEPENDENCIES_MISSING=1"
  set "DEPENDENCY_REASON=react is missing"
)

if not defined DEPENDENCIES_MISSING if not exist "%KAWARP_PACKAGE%" (
  set "DEPENDENCIES_MISSING=1"
  set "DEPENDENCY_REASON=@kawarp/core is missing"
)

if not defined DEPENDENCIES_MISSING (
  echo [INFO] Project dependencies are already installed.
  exit /b 0
)

echo [INFO] %DEPENDENCY_REASON%.
echo [INFO] This is normal on a fresh GitHub ZIP, because node_modules is not shipped in the archive.
echo [INFO] The installer will now run "bun install" automatically to download the missing packages.
call "%BUN_EXE%" install
if errorlevel 1 (
  echo [ERROR] Dependency bootstrap failed while running "bun install".
  echo The installer tried to fix missing packages automatically, but Bun could not finish the install.
  echo Check your internet connection, antivirus prompts, or Bun setup, then run this script again.
  exit /b 1
)

if not exist "%CREATOR_PACKAGE%" (
  echo [ERROR] "bun install" completed, but @spicemod/creator is still missing.
  echo Delete node_modules and try the installer again. If that still fails, download a fresh ZIP copy.
  exit /b 1
)

if not exist "%REACT_PACKAGE%" (
  echo [ERROR] "bun install" completed, but react is still missing.
  echo Delete node_modules and try the installer again. If that still fails, download a fresh ZIP copy.
  exit /b 1
)

if not exist "%KAWARP_PACKAGE%" (
  echo [ERROR] "bun install" completed, but @kawarp/core is still missing.
  echo Delete node_modules and try the installer again. If that still fails, download a fresh ZIP copy.
  exit /b 1
)

echo [INFO] Dependency bootstrap finished successfully.
exit /b 0

:build_bundle
if not exist "%CREATOR_ENTRY%" (
  echo [ERROR] The local build tool is still missing:
  echo         "%CREATOR_ENTRY%"
  echo The installer expected bun install to provide spicetify-creator, but it did not appear.
  exit /b 1
)

call "%BUN_EXE%" "%CREATOR_ENTRY%" build
if errorlevel 1 (
  echo [ERROR] The local source build failed.
  echo The installer repaired dependencies successfully, but the project still did not compile.
  echo Review the build output above for the first real error, then run the installer again.
  exit /b 1
)
exit /b 0

:finish
popd >nul
if not defined NO_PAUSE (
  echo.
  pause
)
exit /b %EXIT_CODE%
