@echo off
title ReMingo - Start Server
echo Starting the ReMingo server in the background (no window will appear)...
cscript //nologo "%~dp0start-server-hidden.vbs"
echo.
echo Done. To confirm it's running, open this in a browser:
echo   http://localhost:4318/health
echo.
pause
