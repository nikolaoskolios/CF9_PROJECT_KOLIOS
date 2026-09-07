#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm run build
npm run preview -- --host 0.0.0.0
