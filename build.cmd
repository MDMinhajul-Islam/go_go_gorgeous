@echo off
setlocal
set "CODEX_NODE_DIR=C:\Users\Asus\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "VITE_CMD=%~dp0node_modules\.bin\vite.cmd"

if not exist "%VITE_CMD%" (
  echo [ERROR] Project dependencies were not found.
  echo Please ask Codex to install the project dependencies.
  exit /b 1
)

set "PATH=%CODEX_NODE_DIR%;%PATH%"
call "%VITE_CMD%" build
