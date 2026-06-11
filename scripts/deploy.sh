#!/usr/bin/env bash
# ============================================================
# TrueLabel — Server-Deploy (läuft auf dem Hetzner-Host).
# Wird von der GitHub-Actions-Pipeline per SSH/stdin ausgeführt
# und kann auch manuell gestartet werden:
#   ssh root@<host> 'bash -s' < scripts/deploy.sh
# ============================================================
set -euo pipefail

APP_DIR=/opt/TrueLabel
export PORT=3100

cd "$APP_DIR"

echo "→ Code aktualisieren (origin/main)"
git fetch --quiet origin main
git reset --hard origin/main

echo "→ Abhängigkeiten installieren"
npm ci --no-audit --no-fund

echo "→ Produktions-Build"
npm run build

echo "→ PM2-Prozess (zero-downtime reload oder Erststart)"
if pm2 describe truelabel >/dev/null 2>&1; then
  pm2 reload truelabel --update-env
else
  pm2 start npm --name truelabel -- start
fi
pm2 save >/dev/null

echo "✓ TrueLabel deployed auf Port ${PORT}"
