@echo off
REM ============================================
REM  BrandOS Reddit Digest - Daily Task Scheduler
REM  Runs every morning at 8:00 AM
REM  Includes AI analysis via Claude API
REM ============================================

echo Setting up daily Reddit Digest task...

REM Build the command with the project root so dotenv can find .env.local
set "PROJECT_ROOT=%~dp0.."
schtasks /create /tn "BrandOS Reddit Digest" /tr "cmd /c \"cd /d \"%PROJECT_ROOT%\" && node scripts/reddit-digest.mjs\"" /sc daily /st 08:00 /f

if %errorlevel% equ 0 (
    echo.
    echo [OK] Task "BrandOS Reddit Digest" scheduled for 8:00 AM daily.
    echo.
    echo To change the time:
    echo   schtasks /change /tn "BrandOS Reddit Digest" /st 09:00
    echo.
    echo To run it now:
    echo   schtasks /run /tn "BrandOS Reddit Digest"
    echo.
    echo To remove it:
    echo   schtasks /delete /tn "BrandOS Reddit Digest" /f
) else (
    echo.
    echo [ERROR] Failed to create scheduled task. Try running as Administrator.
)

pause
