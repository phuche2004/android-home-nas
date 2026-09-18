#!/bin/bash
set -e

# Script cap nhat cau hinh va reload PM2

REPO_DIR="/root/android-home-nas"

echo "=== Cap nhat code tu repository ==="
if [ -d "$REPO_DIR/.git" ]; then
    cd "$REPO_DIR"
    git fetch origin main
    git reset --hard origin/main
fi

echo "=== Kiem tra va cap nhat file cau hinh ==="
if [ -f "$REPO_DIR/ecosystem.config.js" ]; then
    cp "$REPO_DIR/ecosystem.config.js" /root/ecosystem.config.js
fi

echo "=== Reload cac tien trinh PM2 ==="
pm2 reload home-nas 2>/dev/null || pm2 restart home-nas 2>/dev/null || pm2 start /root/ecosystem.config.js
pm2 save

echo "=== Deploy thanh cong ==="
