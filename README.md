# Android Home NAS (Project Spes-NAS)

[![CI/CD Pipeline](https://github.com/phuche2004/android-home-nas/actions/workflows/deploy.yml/badge.svg)](https://github.com/phuche2004/android-home-nas/actions/workflows/deploy.yml)
[![Platform: Linux ARM64](https://img.shields.io/badge/Platform-Linux%20ARM64-blue.svg)](https://ubuntu.com/)
[![Device: Redmi Note 11](https://img.shields.io/badge/Hardware-Redmi%20Note%2011%20(spes)-orange.svg)](https://www.qualcomm.com/products/mobile/snapdragon/smartphones/snapdragon-6-series-mobile-platforms/snapdragon-680-4g-mobile-platform)
[![Engine: File Browser](https://img.shields.io/badge/Engine-File%20Browser%20v2.63-green.svg)](https://filebrowser.org/)
[![Memory: < 10MB RAM](https://img.shields.io/badge/Footprint-%3C10MB%20RAM-brightgreen.svg)](https://pm2.keymetrics.io/)
[![Zero Trust: Cloudflare + Tailscale](https://img.shields.io/badge/Zero%20Trust-Cloudflare%20%7C%20Tailscale-purple.svg)](https://tailscale.com/)

He thong Home NAS va Server gia lap luu tru dam may ca nhan hoat dong 24/7 tren phan cung dien thoai Android (Rooted / Ubuntu chroot). Cung cap kha nang quan ly file toc do cao, xem media truc tuyen, ket noi tu xa an toan qua Cloudflare Zero Trust va Tailscale Mesh VPN, van hanh boi PM2 va tu dong hoa CI/CD qua GitHub Actions.

---

## Muc luc

1. [Tong quan kien truc](#1-tong-quan-kien-truc)
2. [Bang thong so phan cung va phan mem](#2-bang-thong-so-phan-cung-va-phan-mem)
3. [Tinh nang noi bat](#3-tinh-nang-noi-bat)
4. [Cau truc thu muc ma nguon](#4-cau-truc-thu-muc-ma-nguon)
5. [Huong dan truy cap va dang nhap](#5-huong-dan-truy-cap-va-dang-nhap)
6. [Van hanh va quan tri he thong (PM2)](#6-van-hanh-va-quan-tri-he-thong-pm2)
7. [Chien luoc sao luu va phuc hoi (Disaster Recovery)](#7-chien-luoc-sao-luu-va-phuc-hoi-disaster-recovery)
8. [Quy trinh CI/CD tu dong tren GitHub Actions](#8-quy-trinh-cicd-tu-dong-tren-github-actions)
9. [Kiem soat nguon dien va bao ve pin (ACC)](#9-kiem-soat-nguon-dien-va-bao-ve-pin-acc)

---

## 1. Tong quan kien truc

Kien truc he thong ket hop linh hoat giua phan cung di dong hieu suat cao va mang rieng ao:

```
[ Internet / External Clients ]
       │
       ├─────────────────────────────────────────┐
       ▼ (HTTPS / Port 443)                      ▼ (Tailscale Mesh VPN)
[ Cloudflare Edge / WAF ]                 [ Tailscale Network (100.91.43.5) ]
  Domain: bhair.site                               │
       │ (Argo Tunnel / QUIC)                    │ (Direct WireGuard)
       ▼                                         ▼
[ Android Server: Redmi Note 11 (spes) ]
  ├── cloudflared daemon (Port 3000 mapping)
  ├── PM2 Process Supervisor (Daemon controller)
  │    ├── home-nas (File Browser Go Native Binary, Port 3000)
  │    ├── tunnel (Cloudflare Tunnel)
  │    └── RedisDB (Caching / Session memory)
  └── Storage Backend: UFS 2.2 Internal Flash (/root/nas_storage)
```

---

## 2. Bang thong so phan cung va phan mem

### 2.1. Thong so phan cung (Hardware Specifications)

| Thanh phan | Chi tiet ky thuat |
| :--- | :--- |
| **Thiet bi (Device)** | Xiaomi Redmi Note 11 |
| **Ma may (Codename)** | `spes` / `spesn` (Qualcomm SPES KHAJE IDP nopmi) |
| **Vi xu ly (SoC)** | Qualcomm Snapdragon 680 4G (SM6225) - Tien trinh 6nm |
| **Kien truc CPU** | Octa-core aarch64 (ARMv8-A):<br>- 4x Performance: Kryo 265 Gold (Cortex-A73 @ 2.40 GHz)<br>- 4x Efficiency: Kryo 265 Silver (Cortex-A53 @ 1.90 GHz) |
| **Chip do hoa (GPU)** | Adreno 610 |
| **Bo nho RAM** | 4 GB LPDDR4X (Kha dung thuc te tren Linux: 3.6 GiB) |
| **Bo nho trong (ROM)** | 128 GB UFS 2.2 (Giao tiep host controller `4804000.ufshc`) |
| **Dung luong luu tru NAS** | 103 GB (Partition `/`), hien con trong ~73 GB cho NAS |
| **Pin & Nguon dien** | Li-Po 5,000 mAh (Tich hop module bao ve nguon ACC) |
| **Ket noi mang** | Wi-Fi 802.11 a/b/g/n/ac (Dual-band 2.4GHz / 5GHz) + 4G LTE |
| **Muc tieu thu dien** | ~1.5W - 3.5W (Tiet kiem dien hon 90% so voi x86 PC/Server truyen thong) |

### 2.2. Thong so phan mem (Software Stack)

| Thanh phan | Phien ban / Mo ta |
| :--- | :--- |
| **Android Host** | Android Base (Unlocked Bootloader, Magisk Rooted) |
| **Kernel Linux** | Linux 4.19.307-Murali-g07a766e118a2 aarch64 (Custom Kernel) |
| **Moi truong Linux Chroot**| Ubuntu 22.04.5 LTS (Jammy Jellyfish) ARM64 |
| **Loi luu tru NAS** | File Browser v2.63.23 (Native Go ARM64 compiled binary) |
| **Quan ly tien trinh** | PM2 Runtime v7.0.3 |
| **Node.js Environment** | Node.js v20.20.2 LTS (ARM64) |
| **Mang ao Mesh** | Tailscale v1.98.8 (Userspace tun networking) |
| **Reverse Proxy** | Cloudflare Tunnel daemon (`cloudflared` v2026.6.1) |
| **Quan ly sac pin** | VR25 ACC (Advanced Charging Controller Daemon) |

---

## 3. Tinh nang noi bat

* **Tieu ton tai nguyen cuc thap:** Loi File Browser viet bang Go native chi chiem khoang **4.2 MB RAM** va **0% CPU** khi o trang thai cho.
* **Giao dien Web hien dai:** Ho tro giao dien tieng Viet, che do toi/sang (Dark/Light Mode), tim kiem nhanh theo ten file.
* **Stream Media truc tiep:** Xem truc tiep video MP4/MKV, nghe nhac MP3/FLAC, xem anh va doc tai lieu PDF ngay tren trinh duyet khong can tai ve.
* **Tus Chunked Upload:** Cho phep tai file dung luong lon len server theo tung phan (chunked upload 10MB), tu dong tiep tuc neu mang bi ngat quang.
* **Chia se lien ket (Share Links):** Tao link chia se file ra ngoai co cai dat mat khau va thoi gian het han tu dong.
* **Bao mat Zero Trust:** Khong can mo port modem (khong can NAT port/DMZ), moi truy cap tu ngoai internet duoc bao ve boi Cloudflare WAF va SSL 100%.

---

## 4. Cau truc thu muc ma nguon

```
android-home-nas/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD Pipeline
├── config/
│   └── filebrowser.json        # Ban sao cau hinh chuan cua File Browser
├── scripts/
│   ├── setup.sh                # Script cai dat va khoi tao toan bo tu dau
│   ├── backup.sh               # Script tu dong sao luu database va trang thai
│   └── deploy.sh               # Script cap nhat ma nguon va reload he thong
├── ecosystem.config.js         # Cau hinh quan tri tien trinh PM2
├── .gitignore                  # Loai tru file secret, db, cache
└── README.md                   # Tai lieu huong dan toan dien
```

---

## 5. Huong dan truy cap va dang nhap

### 5.1. Truy cap qua Internet cong cong
* **Ten mien chinh:** `https://bhair.site`
* **Ten mien phu:** `https://www.bhair.site`

### 5.2. Truy cap qua mang noi bo Tailscale
* **IP noi bo:** `http://100.91.43.5:3000`

### 5.3. Thong tin dang nhap mac dinh
* **Tai khoan quan tri:** `admin`
* **Mat khau:** `Admin@123456`

*(Luu y: Sau khi dang nhap lan dau tien, vao muc `Cai dat` o menu ben trai de doi mat khau ca nhan va tao them user cho thanh vien gia dinh).*

---

## 6. Van hanh va quan tri he thong (PM2)

He thong su dung PM2 lam Process Supervisor de duy tri tinh san sang 24/7 va tu khoi dong lai khi co su co.

### Kiem tra trang thai hoat dong:
```bash
pm2 status
```

### Xem log thoi gian thuc cua File Browser:
```bash
pm2 logs home-nas --lines 50
```

### Xem log Cloudflare Tunnel:
```bash
pm2 logs tunnel --lines 50
```

### Khoi dong lai toan bo dich vu:
```bash
pm2 restart all
```

### Luu trang thai tien trinh de tu chay cung he thong:
```bash
pm2 save
```

---

## 7. Chien luoc sao luu va phuc hoi (Disaster Recovery)

Database luu tru toan bo cau hinh, thong tin user, quyen va link share duoc luu tru tai `/root/filebrowser.db`.

### 7.1. Chay sao luu thu cong
```bash
bash /root/android-home-nas/scripts/backup.sh
```
Script se tu dong:
1. Sao luu file `/root/filebrowser.db` vao thu muc `/root/backups/filebrowser_YYYYMMDD_HHMMSS.db`.
2. Sao luu snapshot trang thai PM2 vao `/root/backups/pm2_dump_YYYYMMDD_HHMMSS.json`.
3. Tu dong don dep cac ban backup cu hon 7 ngay de tiet kiem bo nho.

### 7.2. Phuc hoi khi co su co
Neu muon phuc hoi database ve mot ban sao luu truoc do:
```bash
pm2 stop home-nas
cp /root/backups/filebrowser_<timestamp>.db /root/filebrowser.db
pm2 start home-nas
```

---

## 8. Quy trinh CI/CD tu dong tren GitHub Actions

Pipeline CI/CD duoc dinh nghia trong `.github/workflows/deploy.yml` gom 2 giai doan:

### 8.1. Stage 1: Validation & Linting
* Kiem tra cu phap cac file script Shell (`scripts/*.sh`) bang `bash -n`.
* Validate tinh hop le cua file cau hinh `config/filebrowser.json`.
* Kiem tra cu phap Node.js cua `ecosystem.config.js` bang `node --check`.

### 8.2. Stage 2: Automated Deployment (Over Tailscale Mesh)
Khi ma nguon duoc merge hoac push vao nhanh `main`:
1. GitHub Runner khoi tao ket noi vao mang VPN Tailscale bang `TAILSCALE_AUTHKEY`.
2. Runner thuc hien SSH an toan vao dia chi `100.91.43.5:2222` bang `SSH_PRIVATE_KEY`.
3. Chay script `scripts/deploy.sh` de dong bo file cau hinh va reload PM2 khong gay gian doan dich vu (zero-downtime reload).

#### Cac Secret can thiet lap trong GitHub Repository Settings:
* `TAILSCALE_AUTHKEY`: Auth key sinh tu Tailscale Admin Console (Tags: `tag:ci`).
* `SSH_PRIVATE_KEY`: Private SSH Key dung de xac thuc voi server.
* `SERVER_HOST`: Dia chi Tailscale cua server (Mac dinh: `100.91.43.5`).

---

## 9. Kiem soat nguon dien va bao ve pin (ACC)

De dam bao dien thoai hoat dong 24/7 khong bi phu pin, chay no hay chai pin, he thong su dung daemon **ACC (Advanced Charging Controller)** duoc tich hop truc tiep trong Magisk:

* **Tien trinh quan ly:** `/system/bin/sh /data/adb/vr25/acc/accd.sh`
* **Nguong ngat sac:** Tu dong ngat dong sac khi pin dat 80-85% va chi cho sac tiep khi pin xuong duoi 70%.
* **Kiem soat nhiet do:** Duy tri nhiet do pin luon o muc ly tuong 30°C - 33°C (Thuc do hien tai: **31.3°C**).
* **Dong dong co ban:** Chay che do Battery Idle khi cam sac lau dai de dien thoai lay nguon truc tiep tu cu sac ma khong nap xa qua pin.

---

## 10. Giay phep (License)

Du an duoc phat hanh theo giay phep [MIT License](LICENSE).
Moi quyen so huu tri tue va ma nguon thuoc ve tac gia [phuche2004](https://github.com/phuche2004).
