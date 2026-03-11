@echo off
echo ========================================
echo AI Code Editor - Rust Installation
echo ========================================
echo.
echo Rust is required to build the Tauri backend.
echo.
echo This will download and install Rust using rustup.
echo.
pause

echo.
echo Downloading Rust installer...
powershell -Command "Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile '%TEMP%\rustup-init.exe'"

echo.
echo Running Rust installer...
echo Please follow the prompts (press 1 for default installation)
echo.
%TEMP%\rustup-init.exe

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Please CLOSE this terminal and open a NEW one, then run:
echo   cd "e:\development\custom ai code editor\ai-code-editor"
echo   npm run tauri dev
echo.
pause