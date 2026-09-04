#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
./.venv/bin/python -m uvicorn DeathStarTestDataApp.main:app --reload --port 8000
