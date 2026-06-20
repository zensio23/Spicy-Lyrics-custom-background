@echo off
setlocal EnableExtensions
set "MOCK_ROOT=%~dp0mock-spicetify-userdata"
if /I "%~1"=="path" if /I "%~2"=="userdata" (
  echo %MOCK_ROOT%
  exit /b 0
)
if /I "%~1"=="config" (
  >> "%MOCK_ROOT%\mock-config.log" echo config %*
  exit /b 0
)
if /I "%~1"=="apply" (
  >> "%MOCK_ROOT%\mock-apply.log" echo apply %*
  exit /b 0
)
>> "%MOCK_ROOT%\mock-other.log" echo %*
exit /b 0
