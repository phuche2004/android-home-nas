# Android Home NAS (Project Spes-NAS)

[![CI/CD Pipeline](https://github.com/phuche2004/android-home-nas/actions/workflows/deploy.yml/badge.svg)](https://github.com/phuche2004/android-home-nas/actions/workflows/deploy.yml)
[![Platform: Linux ARM64](https://img.shields.io/badge/Platform-Linux%20ARM64-blue.svg)](https://ubuntu.com/)
[![Device: Redmi Note 11](https://img.shields.io/badge/Hardware-Redmi%20Note%2011%20(spes)-orange.svg)](https://www.qualcomm.com/products/mobile/snapdragon/smartphones/snapdragon-6-series-mobile-platforms/snapdragon-680-4g-mobile-platform)
[![Engine: File Browser](https://img.shields.io/badge/Engine-File%20Browser%20v2.63-green.svg)](https://filebrowser.org/)
[![Memory: < 10MB RAM](https://img.shields.io/badge/Footprint-%3C10MB%20RAM-brightgreen.svg)](https://pm2.keymetrics.io/)
[![Zero Trust: Cloudflare + Tailscale](https://img.shields.io/badge/Zero%20Trust-Cloudflare%20%7C%20Tailscale-purple.svg)](https://tailscale.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An ultra-lightweight, 24/7 Home NAS and private cloud storage solution running on repurposed rooted Android hardware with an Ubuntu Linux chroot environment. Engineered for minimal power consumption (~1.5W-3.5W), high-speed file transfers, on-the-fly media streaming, Zero Trust remote access via Cloudflare Tunnel and Tailscale Mesh VPN, supervised by PM2, and automated via GitHub Actions CI/CD pipelines.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Hardware & Software Specifications](#2-hardware--software-specifications)
3. [Key Highlights & Features](#3-key-highlights--features)
4. [Repository Structure](#4-repository-structure)
5. [Access & Authentication](#5-access--authentication)
6. [Operations & Process Management (PM2)](#6-operations--process-management-pm2)
7. [Backup & Disaster Recovery](#7-backup--disaster-recovery)
8. [CI/CD Pipeline (GitHub Actions)](#8-cicd-pipeline-github-actions)
9. [Power Management & Thermal Protection (ACC)](#9-power-management--thermal-protection-acc)
10. [License](#10-license)

---

## 1. Architecture Overview

The system bridges low-power mobile ARM64 hardware with modern edge networking to provide secure access without opening ports on local routers (no NAT/port-forwarding required):

```
[ External Clients / Internet ]
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
  │    └── RedisDB (Session cache)
  └── Storage Backend: UFS 2.2 Internal Flash (/root/nas_storage)
```

---

## 2. Hardware & Software Specifications

### 2.1. Hardware Specifications

| Component | Technical Details |
| :--- | :--- |
| **Host Device** | Xiaomi Redmi Note 11 |
| **Hardware Codename** | `spes` / `spesn` (Qualcomm SPES KHAJE IDP nopmi) |
| **SoC / Chipset** | Qualcomm Snapdragon 680 4G (SM6225) - 6nm FinFET process |
| **CPU Architecture** | Octa-core aarch64 (ARMv8-A):<br>- 4x Performance: Kryo 265 Gold (Cortex-A73 @ 2.40 GHz)<br>- 4x Efficiency: Kryo 265 Silver (Cortex-A53 @ 1.90 GHz) |
| **GPU** | Qualcomm Adreno 610 |
| **System Memory** | 4 GB LPDDR4X (Usable on Linux chroot: 3.6 GiB) |
| **Internal Storage** | 128 GB UFS 2.2 (`4804000.ufshc` controller) |
| **NAS Usable Partition** | 103 GB Root partition (`/`), ~73 GB unallocated capacity |
| **Battery & Power** | 5,000 mAh Li-Po with hardware-level charge control daemon |
| **Network Interfaces** | Wi-Fi 802.11 a/b/g/n/ac (Dual-band 2.4GHz / 5GHz) + 4G LTE |
| **Power Consumption** | ~1.5W - 3.5W idle/active (~90% lower than traditional x86 mini PCs) |

### 2.2. Software Stack

| Layer | Technology & Version |
| :--- | :--- |
| **Android Host Base** | Unlocked Bootloader, Magisk Rooted |
| **Linux Kernel** | Linux 4.19.307-Murali-g07a766e118a2 aarch64 |
| **Linux Distribution** | Ubuntu 22.04.5 LTS (Jammy Jellyfish) aarch64 chroot |
| **NAS Core Engine** | File Browser v2.63.23 (Native Go ARM64 compiled binary) |
| **Process Manager** | PM2 Runtime v7.0.3 |
| **Runtime Environment**| Node.js v20.20.2 LTS (ARM64) |
| **Mesh VPN** | Tailscale v1.98.8 (Userspace networking mode) |
| **Edge Ingress Tunnel** | Cloudflare Tunnel daemon (`cloudflared` v2026.6.1) |
| **Charging Controller** | VR25 ACC (Advanced Charging Controller Daemon) |

---

## 3. Key Highlights & Features

* **Ultra-Low Memory Footprint:** The native Go binary consumes only **4.2 MB RAM** and **0% CPU** at idle, leaving plenty of overhead for the system.
* **Modern Web Interface:** Full-featured responsive web client with dark/light themes, search functionality, and localization support.
* **Direct Media Streaming:** Stream video (MP4/MKV), audio (MP3/FLAC), and preview image galleries or PDF documents directly in browser without downloading.
* **Resumable Chunked Uploads:** Powered by Tus protocol with 10MB chunking, enabling reliable large-file uploads even over unstable wireless connections.
* **Granular Access Control:** Role-based permission management (create, delete, rename, modify, share, execute) and multi-user support.
* **Time-Limited Share Links:** Create password-protected public download links with custom expiration periods.
* **Zero-Port-Forwarding Security:** Traffic is routed through Cloudflare Tunnel (SSL/TLS terminated at the edge) and Tailscale WireGuard mesh, keeping all local ports closed to the open internet.

---

## 4. Repository Structure

```
android-home-nas/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD Pipeline
├── config/
│   └── filebrowser.json        # Reference configuration for File Browser
├── scripts/
│   ├── setup.sh                # Automated setup and initial provisioning script
│   ├── backup.sh               # Scheduled database and state backup script
│   └── deploy.sh               # In-place deployment and PM2 reload script
├── ecosystem.config.js         # PM2 process configuration definition
├── .gitignore                  # Exclusion rules for secrets, DBs, and logs
├── LICENSE                     # MIT License
└── README.md                   # System documentation
```

---

## 5. Access & Authentication

### 5.1. Public Internet Access
* **Primary URL:** `https://bhair.site`
* **Alternative Domain:** `https://www.bhair.site`

### 5.2. Private Mesh Network (Tailscale)
* **Internal IP:** `http://100.91.43.5:3000`

### 5.3. Authentication & User Management
* Administrative and standard user accounts are configured via the system database (`/root/filebrowser.db`).
* Multi-user management, password rotation, and permission scopes can be managed directly in the web UI under `Settings -> User Management`.

---

## 6. Operations & Process Management (PM2)

PM2 supervises all critical server daemons, ensuring continuous uptime and automatic restart upon unexpected failures.

### Check service status:
```bash
pm2 status
```

### View real-time File Browser logs:
```bash
pm2 logs home-nas --lines 50
```

### View Cloudflare Tunnel ingress logs:
```bash
pm2 logs tunnel --lines 50
```

### Restart all services:
```bash
pm2 restart all
```

### Save current process snapshot for auto-start:
```bash
pm2 save
```

---

## 7. Backup & Disaster Recovery

The entire system state (user accounts, permission scopes, share tokens, and system settings) is preserved in `/root/filebrowser.db`.

### 7.1. Running Manual Backups
```bash
bash /root/android-home-nas/scripts/backup.sh
```
This automated routine:
1. Creates a timestamped database snapshot in `/root/backups/filebrowser_YYYYMMDD_HHMMSS.db`.
2. Dumps active PM2 configuration into `/root/backups/pm2_dump_YYYYMMDD_HHMMSS.json`.
3. Automatically prunes snapshots older than 7 days to preserve storage.

### 7.2. Restoration Procedure
To restore the system state from a prior snapshot:
```bash
pm2 stop home-nas
cp /root/backups/filebrowser_<timestamp>.db /root/filebrowser.db
pm2 start home-nas
```

---

## 8. CI/CD Pipeline (GitHub Actions)

The automation workflow in `.github/workflows/deploy.yml` runs on every push to `main` or via manual dispatch:

### 8.1. Stage 1: Validation & Linting
* Syntax check on all Shell scripts (`scripts/*.sh`) using `bash -n`.
* JSON schema validation on `config/filebrowser.json`.
* Node.js syntax verification for `ecosystem.config.js` using `node --check`.

### 8.2. Stage 2: Automated Deployment (Over Tailscale Mesh)
When the pipeline detects valid configurations:
1. The GitHub Runner securely joins the Tailscale mesh using `TAILSCALE_AUTHKEY`.
2. Initiates an encrypted SSH session to `100.91.43.5:2222` using `SSH_PRIVATE_KEY`.
3. Executes `scripts/deploy.sh` to update codebase and perform a zero-downtime PM2 reload.

#### Required Repository Secrets:
* `TAILSCALE_AUTHKEY`: Ephemeral/reusable authentication key generated from the Tailscale Admin Console.
* `SSH_PRIVATE_KEY`: Private Ed25519/RSA key authorized in the server's `~/.ssh/authorized_keys`.
* `SERVER_HOST`: The internal Tailscale IP of the server (default: `100.91.43.5`).

---

## 9. Power Management & Thermal Protection (ACC)

To ensure reliable 24/7 continuous operation without thermal throttling or battery swelling, the server utilizes the **VR25 ACC (Advanced Charging Controller)** daemon integrated at the kernel/Magisk level:

* **Controller Daemon:** `/system/bin/sh /data/adb/vr25/acc/accd.sh`
* **Charging Capacity Thresholds:** Automatically halts charging when capacity reaches 80-85% and resumes only when discharging below 70%.
* **Thermal Throttling Guard:** Keeps battery core temperature stable at ~30°C - 33°C (Verified active temperature: **31.3°C**).
* **Battery Idle Mode:** Directs power from the adapter straight to device hardware without cyclic charging/discharging.

---

## 10. License

This project is open-source software licensed under the [MIT License](LICENSE).
Copyright (c) 2026 Dinh Anh Phuc ([phuche2004](https://github.com/phuche2004)).
