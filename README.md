# Android Home NAS & Server Deployment

He thong Home NAS sieu nhe chay tren Android Linux chroot (ARM64), quan ly tien trinh bang PM2, ket noi tu xa thong qua Cloudflare Tunnel va Tailscale, kem theo quy trinh CI/CD tu dong tren GitHub Actions.

---

## 1. Thong tin he thong

* **Thiet bi:** Android Phone (Rooted, Linux chroot Ubuntu 22.04 aarch64)
* **Core NAS:** File Browser (Native Go binary - RAM ~5MB)
* **Quan ly tien trinh:** PM2 (Cluster/Fork manager)
* **Ket noi tu xa:**
  * Web Domain: `https://bhair.site` va `https://www.bhair.site` (qua Cloudflare Tunnel)
  * Mang noi bo: Tailscale IP `100.91.43.5` (Port 2222 cho SSH, Port 3000 cho NAS)
* **Thu muc luu tru NAS tren server:** `/root/nas_storage`

---

## 2. Dang nhap & Quan tri

* **Duong dan truy cap:** `https://bhair.site`
* **Tai khoan mac dinh ban dau:**
  * Username: `admin`
  * Password: `Admin@123456`
* *(Khuyen nghi: Sau khi dang nhap lan dau, hay vao phan Cai dat de doi mat khau ca nhan)*.

---

## 3. Cau truc thu muc du an

```
android-home-nas/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD Pipeline
├── config/
│   └── filebrowser.json        # Mau cau hinh File Browser
├── scripts/
│   ├── setup.sh                # Script khoi tao va cai dat ban dau
│   ├── backup.sh               # Script sao luu database va cau hinh
│   └── deploy.sh               # Script cap nhat tu dong tren server
├── ecosystem.config.js         # Cau hinh tien trinh PM2
├── .gitignore
└── README.md
```

---

## 4. Cac lenh quan tri nhanh tren Server

### Kiem tra trang thai dich vu:
```bash
pm2 status
```

### Xem log thoi gian thuc cua NAS:
```bash
pm2 logs home-nas
```

### Khoi dong lai toan bo he thong NAS:
```bash
pm2 restart home-nas
```

### Sao luu thu cong database:
```bash
bash /root/android-home-nas/scripts/backup.sh
```

---

## 5. Quy trinh CI/CD (GitHub Actions)

* **Trigger:** Tu dong chay moi khi push code len nhanh `main` hoac kich hoat thu cong qua tab Actions.
* **Kiem thu:** Kiem tra cu phap cac file config JSON, shell script va file `ecosystem.config.js`.
* **Trien khai tu dong:** Neu duoc cau hinh cac GitHub Secrets sau, runner se tu ket noi mang Tailscale va deploy thang vao server:
  * `TAILSCALE_AUTHKEY`: Reusable / Ephemeral Auth Key tao tu Tailscale Admin Console.
  * `SSH_PRIVATE_KEY`: Private SSH key (id_ed25519) de login vao `root@100.91.43.5:2222`.
  * `SERVER_HOST`: IP Tailscale cua may (mac dinh: `100.91.43.5`).
