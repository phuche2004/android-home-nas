#!/bin/bash
set -e

# Script sao luu database va cau hinh NAS

BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "=== Sao luu database File Browser ==="
if [ -f /root/filebrowser.db ]; then
    cp /root/filebrowser.db "$BACKUP_DIR/filebrowser_${TIMESTAMP}.db"
    echo "Da sao luu: $BACKUP_DIR/filebrowser_${TIMESTAMP}.db"
fi

echo "=== Sao luu danh sach PM2 ==="
pm2 save
cp /root/.pm2/dump.pm2 "$BACKUP_DIR/pm2_dump_${TIMESTAMP}.json" 2>/dev/null || true

# Giu lai 7 ban backup gan nhat
find "$BACKUP_DIR" -type f -mtime +7 -name "*.db" -delete 2>/dev/null || true

echo "=== Hoan tat sao luu ==="
