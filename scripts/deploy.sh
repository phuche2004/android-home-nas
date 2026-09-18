#!/bin/bash
set -e

# Script deploy tu dong cap nhat frontend, backend va PM2

REPO_DIR="/root/android-home-nas"

echo "=== 1. Cap nhat ma nguon tu Git ==="
cd "$REPO_DIR"
git fetch origin main
git reset --hard origin/main

echo "=== 2. Cai dat goi Server Gateway ==="
cd "$REPO_DIR/server"
npm install --production

echo "=== 3. Kiem tra Frontend Build ==="
# Neu co su thay doi o web hoac chua co dist thi build
if [ ! -d "$REPO_DIR/web/dist" ]; then
    echo "Dang build frontend web..."
    cd "$REPO_DIR/web"
    npm install
    npm run build
fi

echo "=== 4. Dong bo ecosystem config ==="
cp "$REPO_DIR/ecosystem.config.js" /root/ecosystem.config.js

echo "=== 5. Reload cac dich vu PM2 ==="
pm2 startOrReload /root/ecosystem.config.js
pm2 save

echo "=== DEPLOY HOAN TAT ==="
