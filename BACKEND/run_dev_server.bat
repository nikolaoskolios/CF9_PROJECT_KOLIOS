@echo off
cd /d "%~dp0"
".venv\Scripts\python.exe" -m uvicorn DeathStarTestDataApp.main:app --reload --port 8000