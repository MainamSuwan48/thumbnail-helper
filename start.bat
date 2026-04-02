@echo off
title Thumbnail Helper
cd /d "%~dp0"

echo ========================================
echo   Thumbnail Helper - Production Build
echo ========================================
echo.

echo [1/2] Building project...
call bun run build
if %errorlevel% neq 0 (
    echo.
    echo BUILD FAILED! Check the errors above.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting server...
echo.
echo Opening http://localhost:3000 in your browser...
start "" http://localhost:3000

set NODE_ENV=production
call bun run start

pause
