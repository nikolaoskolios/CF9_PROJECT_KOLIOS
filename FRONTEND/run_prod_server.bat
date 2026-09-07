@echo off
cd /d "%~dp0"
npm run build
npm run preview -- --host 0.0.0.0
