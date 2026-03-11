@echo off
echo ========================================
echo Adding Rust to PATH
echo ========================================
echo.

set CARGO_PATH=%USERPROFILE%\.cargo\bin

echo Checking if Rust is installed at: %CARGO_PATH%
if exist "%CARGO_PATH%\cargo.exe" (
    echo Found Rust installation!
    echo.
    echo Adding to PATH for current session...
    set PATH=%CARGO_PATH%;%PATH%
    
    echo.
    echo Testing Rust installation:
    cargo --version
    rustc --version
    
    echo.
    echo ========================================
    echo Success! Rust is now available.
    echo ========================================
    echo.
    echo You can now run:
    echo   npm run tauri dev
    echo.
) else (
    echo ERROR: Rust not found at %CARGO_PATH%
    echo.
    echo Please run the Rust installer again:
    echo   https://rustup.rs/
    echo.
)

pause