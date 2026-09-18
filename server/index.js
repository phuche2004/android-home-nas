const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ENGINE_PORT = process.env.ENGINE_PORT || 8080;
const CLIENT_DIST = path.join(__dirname, '../web/dist');

app.use(cors());

// Trust proxy for Cloudflare Tunnel
app.set('trust proxy', true);

// Helper to safely read system file
function readSysFile(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8').trim();
    }
  } catch (e) {
    // Ignore read errors
  }
  return defaultValue;
}

// 1. Hardware Telemetry Endpoint
app.get('/api/system/telemetry', (req, res) => {
  try {
    // Battery & Power metrics from /sys/class/power_supply/battery
    const batPath = '/sys/class/power_supply/battery';
    const capacity = parseInt(readSysFile(`${batPath}/capacity`, '80'), 10);
    const status = readSysFile(`${batPath}/status`, 'Charging');
    const rawTemp = parseInt(readSysFile(`${batPath}/temp`, '310'), 10);
    const tempCelsius = (rawTemp / 10).toFixed(1);
    const currentNowUa = parseInt(readSysFile(`${batPath}/current_now`, '0'), 10);
    const currentMa = Math.round(currentNowUa / 1000);
    const voltageNowUv = parseInt(readSysFile(`${batPath}/voltage_now`, '4000000'), 10);
    const voltageV = (voltageNowUv / 1000000).toFixed(2);
    const health = readSysFile(`${batPath}/health`, 'Good');
    const chargeType = readSysFile(`${batPath}/charge_type`, 'Taper');

    // Qualcomm Snapdragon 680 CPU Core Frequencies (8 Cores)
    const cpuCores = [];
    for (let i = 0; i < 8; i++) {
      const freqKhz = parseInt(readSysFile(`/sys/devices/system/cpu/cpu${i}/cpufreq/scaling_cur_freq`, '0'), 10);
      const freqMhz = Math.round(freqKhz / 1000);
      const isGold = i >= 4;
      cpuCores.push({
        core: i,
        name: isGold ? `Kryo Gold Core ${i - 3}` : `Kryo Silver Core ${i + 1}`,
        type: isGold ? 'performance' : 'efficiency',
        freqMhz: freqMhz || (isGold ? 2400 : 1900),
        maxFreqMhz: isGold ? 2400 : 1900,
        usagePercent: Math.min(100, Math.round(((freqMhz || (isGold ? 2400 : 1900)) / (isGold ? 2400 : 1900)) * 100))
      });
    }

    // Memory info from /proc/meminfo
    const meminfo = readSysFile('/proc/meminfo', '');
    let totalMemKb = 0;
    let availMemKb = 0;
    let freeMemKb = 0;
    let buffersKb = 0;
    let cachedKb = 0;

    meminfo.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parseInt(parts[1].trim().replace('kB', '').trim(), 10) || 0;
        if (key === 'MemTotal') totalMemKb = val;
        if (key === 'MemAvailable') availMemKb = val;
        if (key === 'MemFree') freeMemKb = val;
        if (key === 'Buffers') buffersKb = val;
        if (key === 'Cached') cachedKb = val;
      }
    });

    const totalMemMb = Math.round(totalMemKb / 1024) || Math.round(os.totalmem() / 1024 / 1024);
    const freeMemMb = Math.round(freeMemKb / 1024);
    const buffersCachedMb = Math.round((buffersKb + cachedKb) / 1024);
    const availMemMb = Math.round(availMemKb / 1024) || Math.round(os.freemem() / 1024 / 1024);
    // Standard Linux free -m formula: used = total - free - buffers - cached
    const usedMemMb = Math.max(0, totalMemMb - freeMemMb - buffersCachedMb);

    // Storage info (UFS 2.2 storage)
    let storageTotalGb = 103;
    let storageFreeGb = 73;
    let storageUsedGb = 30;
    try {
      if (fs.statfsSync) {
        const stats = fs.statfsSync('/root/nas_storage');
        storageTotalGb = Number((stats.blocks * stats.bsize / 1024 / 1024 / 1024).toFixed(1));
        storageFreeGb = Number((stats.bavail * stats.bsize / 1024 / 1024 / 1024).toFixed(1));
        storageUsedGb = Number((storageTotalGb - storageFreeGb).toFixed(1));
      }
    } catch (e) {
      // Fallback
    }

    // Thermal / ACC Status
    const accScriptExists = fs.existsSync('/data/adb/vr25/acc/accd.sh');

    res.json({
      timestamp: new Date().toISOString(),
      device: {
        model: 'Xiaomi Redmi Note 11',
        codename: 'spes',
        soc: 'Qualcomm Snapdragon 680 4G (SM6225)',
        processNode: '6nm FinFET',
        gpu: 'Qualcomm Adreno 610',
        architecture: 'aarch64 (ARMv8-A)',
        os: 'Ubuntu 22.04.5 LTS (Linux 4.19.307-Murali)',
        uptimeSeconds: Math.round(os.uptime()),
        loadAvg: os.loadavg().map(v => Number(v.toFixed(2)))
      },
      power: {
        batteryPercent: capacity,
        status: status,
        tempCelsius: parseFloat(tempCelsius),
        health: health,
        currentMa: currentMa,
        voltageV: parseFloat(voltageV),
        chargeType: chargeType,
        accProtectionActive: accScriptExists,
        isSafeCharging: parseFloat(tempCelsius) < 38.0
      },
      cpu: {
        cores: cpuCores,
        totalCores: 8,
        performanceCores: 4,
        efficiencyCores: 4
      },
      memory: {
        totalMb: totalMemMb,
        usedMb: usedMemMb,
        availableMb: availMemMb,
        freeMb: Math.round(freeMemKb / 1024),
        buffersCachedMb: Math.round((buffersKb + cachedKb) / 1024),
        usagePercent: Math.round((usedMemMb / totalMemMb) * 100)
      },
      storage: {
        path: '/root/nas_storage',
        type: 'UFS 2.2 Flash',
        totalGb: storageTotalGb,
        usedGb: storageUsedGb,
        freeGb: storageFreeGb,
        usagePercent: Math.round((storageUsedGb / storageTotalGb) * 100)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read system telemetry', details: err.message });
  }
});

// 2. Reverse Proxy to File Browser Go Backend (Port 8080)
const proxyPaths = ['/api/login', '/api/resources', '/api/raw', '/api/shares', '/api/share', '/api/users', '/api/public'];

app.use((req, res, next) => {
  const isProxyTarget = proxyPaths.some(prefix => req.path.startsWith(prefix));
  if (!isProxyTarget) {
    return next();
  }

  // Create streaming proxy request
  const options = {
    hostname: '127.0.0.1',
    port: ENGINE_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${ENGINE_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Storage Engine (File Browser) Unreachable',
        message: 'The core Go storage backend on port 8080 is not responding.',
        details: err.message
      });
    }
  });

  req.pipe(proxyReq);
});

// 3. Serve Frontend Web App (SPA)
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('<h1>Home NAS Gateway</h1><p>Frontend is currently building. Access /api/system/telemetry for status.</p>');
  });
}

// Start Gateway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Home NAS Gateway] Online at http://0.0.0.0:${PORT}`);
  console.log(`[Home NAS Gateway] Storage Engine mapped at http://127.0.0.1:${ENGINE_PORT}`);
});
