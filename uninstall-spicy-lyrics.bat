@echo off
setlocal EnableExtensions

set "EXTENSION_FILE_JS=spicy-lyrics.js"
set "EXTENSION_FILE_MJS=spicy-lyrics.mjs"

where spicetify >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Spicetify is not available on PATH.
  exit /b 1
)

set "SPICETIFY_DIR="
for /f "usebackq delims=" %%I in (`spicetify path userdata 2^>nul`) do (
  set "SPICETIFY_DIR=%%I"
)

if not defined SPICETIFY_DIR (
  set "SPICETIFY_DIR=%APPDATA%\spicetify"
)

set "EXTENSIONS_DIR=%SPICETIFY_DIR%\Extensions"
set "TARGET_FILE_JS=%EXTENSIONS_DIR%\%EXTENSION_FILE_JS%"
set "TARGET_FILE_MJS=%EXTENSIONS_DIR%\%EXTENSION_FILE_MJS%"

echo Removing %EXTENSION_FILE_JS% and %EXTENSION_FILE_MJS% from Spicetify config...
spicetify config extensions %EXTENSION_FILE_JS%- >nul 2>&1
spicetify config extensions %EXTENSION_FILE_MJS%-
if errorlevel 1 (
  echo [ERROR] Failed to update Spicetify config.
  exit /b 1
)

if exist "%TARGET_FILE_JS%" (
  del /F /Q "%TARGET_FILE_JS%"
  if errorlevel 1 (
    echo [ERROR] Failed to delete:
    echo         "%TARGET_FILE_JS%"
    exit /b 1
  )
)

if exist "%TARGET_FILE_MJS%" (
  del /F /Q "%TARGET_FILE_MJS%"
  if errorlevel 1 (
    echo [ERROR] Failed to delete:
    echo         "%TARGET_FILE_MJS%"
    exit /b 1
  )
)

echo Applying Spicetify...
spicetify apply
if errorlevel 1 (
  echo [ERROR] Spicetify apply failed.
  exit /b 1
)

echo.
echo Uninstalled Spicy Lyrics successfully.
exit /b 0
