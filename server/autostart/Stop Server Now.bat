@echo off
title ReMingo - Stop Server
echo Looking for a ReMingo server running on port 4318...

set FOUND=0
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":4318" ^| findstr "LISTENING"') do (
    taskkill /PID %%P /F >nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo The ReMingo server has been stopped.
) else (
    echo No ReMingo server was running.
)
echo.
echo Note: if autostart is enabled, it will start again next time you log in.
echo Use "Disable Autostart.bat" in this folder to turn that off too.
echo.
pause
