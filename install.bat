@echo off
cd /d "%~dp0"
call npm install
echo.
echo === Installation Complete ===
echo.
dir node_modules /b 2>nul || echo node_modules not created
