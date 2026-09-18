#!/bin/bash
set -e

# Script khoi tao va cai dat Home NAS tren Android Linux chroot

echo "=== 1. Kiem tra kien truc va thu muc ==="
ARCH=$(uname -m)
echo "Architecture: $ARCH"
mkdir -p /root/nas_storage
mkdir -p /root/backups

echo "=== 2. Cai dat File Browser ==="
if ! command -v filebrowser &> /dev/null; then
    echo "Dang tai File Browser binary..."
    curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | bash
else
    echo "File Browser da duoc cai dat: $(filebrowser version)"
fi

echo "=== 3. Khoi tao Database cau hinh ==="
if [ ! -f /root/filebrowser.db ]; then
    echo "Khoi tao database moi..."
    filebrowser config init -d /root/filebrowser.db
    filebrowser config set -d /root/filebrowser.db \
        --address 0.0.0.0 \
        --port 3000 \
        --root /root/nas_storage \
        --locale vi \
        --minimumPasswordLength 6 \
        --branding.name "Home NAS"
    
    filebrowser users add admin Admin@123456 --perm.admin=true -d /root/filebrowser.db
    echo "Da tao user admin voi mat khau mac dinh: Admin@123456"
else
    echo "Database /root/filebrowser.db da ton tai, giu nguyen."
fi

echo "=== 4. Khoi dong dich vu voi PM2 ==="
pm2 start /usr/local/bin/filebrowser --name "home-nas" -- -d /root/filebrowser.db || pm2 restart home-nas
pm2 save

echo "=== CAI DAT HOAN TAT ==="
echo "Giao dien NAS dang chay tai port 3000"
