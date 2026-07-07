@echo off
title ReMingo - Disable Autostart
set "LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ReMingo Server.lnk"

if exist "%LNK%" (
    del "%LNK%"
    echo Autostart disabled. The ReMingo server will no longer launch automatically at login.
) else (
    echo Autostart was already off - no startup shortcut was found.
)
echo.
echo This only stops it from launching at your NEXT login.
echo To stop a copy that's already running right now, use "Stop Server Now.bat".
echo.
pause
