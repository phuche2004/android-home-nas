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
const ESP_DASHBOARD_DIR = path.join(__dirname, '../esp-dashboard');
const STORE_FILE = path.join(ESP_DASHBOARD_DIR, 'history_store.json');

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

// 1. Hardware Telemetry Endpoint (Android Server)
app.get('/api/system/telemetry', (req, res) => {
  try {
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
    const usedMemMb = Math.max(0, totalMemMb - freeMemMb - buffersCachedMb);

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

// ==========================================================
// 1.5. ESP32-S3 IoT Telemetry & Historical Storage Engine
// ==========================================================
// Tự động hết hạn vào 23:59:59 ngày 03/10/2026 (sau 14 ngày)
const DEMO_EXPIRE_AT = new Date('2026-10-03T23:59:59+07:00').getTime();
const isDemoExpired = () => Date.now() > DEMO_EXPIRE_AT;

// Cấu trúc dữ liệu lưu trữ
let latestTelemetry = null;
let lastReceivedTime = 0;
const REALTIME_LIMIT = 300; // 300 điểm = 5 phút gần nhất ở tần suất 1Hz
let realtimeHistory = [];

const LONG_TERM_LIMIT = 1440; // 1440 điểm = 24 giờ với bước downsample 1 phút/điểm
let longTermHistory = [];

const sseClients = new Set();
let packetStats = {
  totalReceived: 0,
  lastSeq: null,
  lostPackets: 0
};

// Bộ tích lũy mẫu (Downsampling Accumulator) cho chu kỳ 60 giây
let sampleBucket = [];
let lastDownsampleTime = Date.now();

// Nạp dữ liệu lịch sử từ file disk (nếu có)
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.longTermHistory)) {
      longTermHistory = parsed.longTermHistory;
    }
    if (parsed && parsed.packetStats) {
      packetStats = parsed.packetStats;
    }
    if (parsed && parsed.latestTelemetry) {
      latestTelemetry = parsed.latestTelemetry;
      lastReceivedTime = latestTelemetry.received_at || 0;
    }
  }
} catch (err) {
  // Bỏ qua lỗi nạp file
}

// Lưu dữ liệu lịch sử xuống disk an toàn
function persistStoreToDisk() {
  try {
    const data = JSON.stringify({
      latestTelemetry,
      packetStats,
      longTermHistory: longTermHistory.slice(-LONG_TERM_LIMIT)
    });
    fs.writeFile(STORE_FILE, data, 'utf8', () => {});
  } catch (e) {
    // Không block server
  }
}

// 1.5.1. Endpoint tiếp nhận dữ liệu từ ESP32-S3 (Hỗ trợ cả Single 1Hz và Batch Ingestion)
app.post('/api/sensor', express.json({ limit: '2mb' }), (req, res) => {
  if (isDemoExpired()) {
    return res.status(410).json({ error: 'Demo period has expired' });
  }

  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const deviceId = data.device_id || req.headers['x-device-id'] || 'ESP32S3_DEVICE';
  const isBatch = data.batch === true || Array.isArray(data.records);

  let rawRecords = [];
  if (isBatch) {
    rawRecords = Array.isArray(data.records) ? data.records : [];
  } else {
    // Gói tin đơn lẻ
    if (!data.metrics) {
      return res.status(400).json({ error: 'Missing metrics object' });
    }
    rawRecords = [{
      timestamp: data.timestamp,
      seq: data.seq,
      metrics: data.metrics,
      diagnostics: data.diagnostics || {},
      status: data.status || {}
    }];
  }

  const now = Date.now();
  lastReceivedTime = now;
  const processedRecords = [];

  for (const r of rawRecords) {
    // Luôn ưu tiên timestamp gốc của thiết bị (NTP UTC)
    const recTimestamp = r.timestamp || Math.floor(now / 1000);
    const recSeq = typeof r.seq === 'number' ? r.seq : null;

    if (recSeq !== null) {
      if (packetStats.lastSeq !== null && recSeq > packetStats.lastSeq + 1) {
        packetStats.lostPackets += (recSeq - packetStats.lastSeq - 1);
      }
      if (packetStats.lastSeq === null || recSeq > packetStats.lastSeq) {
        packetStats.lastSeq = recSeq;
      }
    }
    packetStats.totalReceived++;

    const norm = {
      device_id: deviceId,
      timestamp: recTimestamp,
      seq: recSeq,
      metrics: {
        temperature: Number(r.metrics?.temperature) || 0,
        humidity: Number(r.metrics?.humidity) || 0,
        dew_point: Number(r.metrics?.dew_point) || 0,
        vpd: Number(r.metrics?.vpd) || 0
      },
      diagnostics: {
        chip_temp: Number(r.diagnostics?.chip_temp) || 0,
        cpu_load: Number(r.diagnostics?.cpu_load) || 0,
        cpu0: Number(r.diagnostics?.cpu0) || 0,
        cpu1: Number(r.diagnostics?.cpu1) || 0,
        free_heap: Number(r.diagnostics?.free_heap) || 0,
        uptime_sec: Number(r.diagnostics?.uptime_sec) || 0,
        wifi_rssi: Number(r.diagnostics?.wifi_rssi) || 0
      },
      status: r.status || {},
      received_at: now
    };

    processedRecords.push(norm);
    realtimeHistory.push(norm);
    sampleBucket.push(norm);
  }

  if (realtimeHistory.length > REALTIME_LIMIT) {
    realtimeHistory = realtimeHistory.slice(-REALTIME_LIMIT);
  }

  // Cập nhật latestTelemetry với bản ghi mới nhất theo timestamp
  if (processedRecords.length > 0) {
    const newest = processedRecords[processedRecords.length - 1];
    if (!latestTelemetry || newest.timestamp >= latestTelemetry.timestamp) {
      latestTelemetry = newest;
    }
  }

  // Gom mẫu downsampling định kỳ 60s
  if (now - lastDownsampleTime >= 60000 && sampleBucket.length > 0) {
    const count = sampleBucket.length;
    const avg = (fn) => Number((sampleBucket.reduce((acc, r) => acc + fn(r), 0) / count).toFixed(2));

    const downsampledPoint = {
      timestamp: Math.floor(now / 1000),
      metrics: {
        temperature: avg(r => r.metrics.temperature),
        humidity: avg(r => r.metrics.humidity),
        dew_point: avg(r => r.metrics.dew_point),
        vpd: avg(r => r.metrics.vpd)
      },
      diagnostics: {
        chip_temp: avg(r => r.diagnostics.chip_temp),
        cpu_load: avg(r => r.diagnostics.cpu_load),
        free_heap: Math.round(avg(r => r.diagnostics.free_heap)),
        wifi_rssi: Math.round(avg(r => r.diagnostics.wifi_rssi))
      }
    };

    longTermHistory.push(downsampledPoint);
    if (longTermHistory.length > LONG_TERM_LIMIT) {
      longTermHistory.shift();
    }

    sampleBucket = [];
    lastDownsampleTime = now;
    persistStoreToDisk();
  }

  // Nếu nhận Batch thì lưu ngay xuống đĩa để bảo toàn dữ liệu offline
  if (isBatch && processedRecords.length > 0) {
    persistStoreToDisk();
  }

  // Broadcast tới mọi SSE clients
  if (sseClients.size > 0 && processedRecords.length > 0) {
    const total = packetStats.totalReceived + packetStats.lostPackets;
    const lossRate = total > 0 ? ((packetStats.lostPackets / total) * 100).toFixed(2) : '0.00';
    
    let ssePayload;
    if (isBatch) {
      ssePayload = `data: ${JSON.stringify({
        type: 'batch_ingestion',
        count: processedRecords.length,
        records: processedRecords,
        latest: latestTelemetry,
        stats: {
          totalReceived: packetStats.totalReceived,
          lostPackets: packetStats.lostPackets,
          lossRate: lossRate
        }
      })}\n\n`;
    } else {
      ssePayload = `data: ${JSON.stringify({
        type: 'telemetry',
        data: processedRecords[0],
        stats: {
          totalReceived: packetStats.totalReceived,
          lostPackets: packetStats.lostPackets,
          lossRate: lossRate
        }
      })}\n\n`;
    }

    for (const client of sseClients) {
      try {
        client.write(ssePayload);
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }

  // Trả về HTTP 200 tức thì theo đúng đặc tả BACKEND_API_SPEC.md
  if (isBatch) {
    return res.status(200).json({
      status: 'ok',
      batch: true,
      received_count: processedRecords.length,
      server_time: Math.floor(now / 1000)
    });
  } else {
    return res.status(200).json({
      status: 'ok',
      batch: false,
      ack_seq: processedRecords[0].seq,
      server_time: Math.floor(now / 1000)
    });
  }
});

// 1.5.2. Endpoint lấy dữ liệu khởi tạo
app.get('/api/sensor/latest', (req, res) => {
  if (isDemoExpired()) {
    return res.status(410).json({ error: 'Demo period has expired', expired: true });
  }

  const now = Date.now();
  const isOnline = Boolean(latestTelemetry && (now - lastReceivedTime < 4500));
  const total = packetStats.totalReceived + packetStats.lostPackets;
  const lossRate = total > 0 ? ((packetStats.lostPackets / total) * 100).toFixed(2) : '0.00';

  res.json({
    is_online: isOnline,
    last_seen_sec_ago: latestTelemetry ? Math.round((now - lastReceivedTime) / 1000) : null,
    latest: latestTelemetry,
    realtime_history: realtimeHistory,
    long_term_history: longTermHistory,
    stats: {
      total_received: packetStats.totalReceived,
      lost_packets: packetStats.lostPackets,
      packet_loss_rate: lossRate
    },
    expires_at: new Date(DEMO_EXPIRE_AT).toISOString(),
    expired: false
  });
});

// 1.5.3. Endpoint truy vấn lịch sử theo dải thời gian (?range=5m|1h|24h)
app.get('/api/sensor/history', (req, res) => {
  const range = req.query.range || '5m';
  if (range === '5m') {
    return res.json({ range: '5m', points: realtimeHistory });
  }
  if (range === '1h') {
    const points = longTermHistory.slice(-60);
    return res.json({ range: '1h', points });
  }
  return res.json({ range: '24h', points: longTermHistory });
});

// 1.5.4. Endpoint SSE truyền phát dữ liệu thời gian thực
app.get('/api/sensor/events', (req, res) => {
  if (isDemoExpired()) {
    return res.status(410).json({ error: 'Demo period has expired' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();

  if (latestTelemetry) {
    const total = packetStats.totalReceived + packetStats.lostPackets;
    const lossRate = total > 0 ? ((packetStats.lostPackets / total) * 100).toFixed(2) : '0.00';
    const initPayload = JSON.stringify({
      type: 'initial',
      data: latestTelemetry,
      realtime_history: realtimeHistory,
      long_term_history: longTermHistory,
      stats: {
        totalReceived: packetStats.totalReceived,
        lostPackets: packetStats.lostPackets,
        lossRate: lossRate
      }
    });
    res.write(`data: ${initPayload}\n\n`);
  }

  sseClients.add(res);

  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeatTimer);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    sseClients.delete(res);
  });
});

// 1.5.5. Phục vụ trang Web IoT Dashboard công khai tại /esp (Không cần đăng nhập)
app.use('/esp', express.static(ESP_DASHBOARD_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get(['/esp', '/esp/*'], (req, res) => {
  if (isDemoExpired()) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head><meta charset="utf-8"><title>Demo Hết Hạn</title><style>body{background:#0a0f1d;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}</style></head>
      <body><div><h1>Bản Demo IoT Đã Kết Thúc</h1><p>Thời hạn thử nghiệm 2 tuần đã hoàn tất.</p></div></body>
      </html>
    `);
  }
  res.sendFile(path.join(ESP_DASHBOARD_DIR, 'index.html'));
});

// 2. Reverse Proxy to File Browser Go Backend (Port 8080)
const proxyPaths = ['/api/login', '/api/resources', '/api/raw', '/api/shares', '/api/share', '/api/users', '/api/settings', '/api/public'];

app.use((req, res, next) => {
  const isProxyTarget = proxyPaths.some(prefix => req.path.startsWith(prefix));
  if (!isProxyTarget) {
    return next();
  }

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
  app.use(express.static(CLIENT_DIST, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
