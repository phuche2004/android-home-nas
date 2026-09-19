import React, { useState, useEffect } from 'react';
import {
  Cpu, Battery, BatteryCharging, Zap, Thermometer, HardDrive,
  Activity, ShieldCheck, RefreshCw, Layers, Clock, Radio, Server, CheckCircle2
} from 'lucide-react';
import { fetchTelemetry } from '../lib/api';
import { formatBytes } from '../lib/utils';

export function DeviceMonitor() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = async () => {
    try {
      const data = await fetchTelemetry();
      setTelemetry(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    let timer;
    if (autoRefresh) {
      timer = setInterval(loadData, 2500);
    }
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const formatUptime = (seconds) => {
    if (!seconds) return '---';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d} ngày ${h} giờ ${m} phút`;
  };

  if (loading && !telemetry) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Đang kết nối cảm biến phần cứng Android...</p>
      </div>
    );
  }

  const { device, power, cpu, memory, storage } = telemetry || {};

  // Temperature color helper
  const getTempColor = (temp) => {
    if (temp < 35) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (temp < 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Device Identification & Controls */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10 flex-shrink-0">
              <Server className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{device?.model}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {device?.codename}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
                  {device?.processNode}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                <span>{device?.soc}</span>
                <span>•</span>
                <span>GPU {device?.gpu}</span>
                <span>•</span>
                <span>{device?.os}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-muted-foreground">Cập nhật lần cuối</p>
              <p className="text-xs font-medium text-foreground">{lastUpdated.toLocaleTimeString('vi-VN')}</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                autoRefresh
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-primary animate-pulse' : ''}`} />
              <span>{autoRefresh ? 'Live Auto' : 'Tạm dừng'}</span>
            </button>
            <button
              onClick={loadData}
              title="Làm mới thủ công"
              className="p-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Power & Thermal Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Battery Capacity Gauge */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground">Mức Pin Hệ Thống</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {power?.status === 'Charging' ? <BatteryCharging className="w-4 h-4" /> : <Battery className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">{power?.batteryPercent}%</span>
              <span className="text-xs text-muted-foreground capitalize">{power?.status}</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${power?.batteryPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Battery Temperature Sensor */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground">Nhiệt Độ Pin & Máy</span>
            <div className={`p-2 rounded-xl border ${getTempColor(power?.tempCelsius)}`}>
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">{power?.tempCelsius}°C</span>
              <span className="text-xs text-emerald-400 font-medium">Mát mẻ (Lý tưởng)</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Điện áp: <span className="font-mono text-foreground">{power?.voltageV}V</span> • Dòng: <span className="font-mono text-foreground">{power?.currentMa}mA</span>
            </p>
          </div>
        </div>

        {/* VR25 ACC Charging Controller Status */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground">Bảo Vệ Nguồn ACC</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">
                {power?.accProtectionActive ? 'Bảo vệ đang chạy' : 'Tiêu chuẩn'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Chế độ ngắt sạc thông minh chống phù pin, chạy 24/7 không chai cell pin.
            </p>
          </div>
        </div>

        {/* System Uptime & Load */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground">Thời Gian Chạy (Uptime)</span>
            <div className="p-2 rounded-xl bg-secondary text-muted-foreground border border-border">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">{formatUptime(device?.uptimeSeconds)}</span>
            <p className="text-[11px] text-muted-foreground mt-2">
              Tải hệ thống: <span className="font-mono text-foreground">{device?.loadAvg?.join(' • ')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Qualcomm Snapdragon 680 Octa-Core Breakdown */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Qualcomm Snapdragon 680 - 8 Nhân CPU</h3>
              <p className="text-xs text-muted-foreground">Theo dõi xung nhịp và mức hoạt động từng lõi vi xử lý thời gian thực</p>
            </div>
          </div>
          <span className="text-xs font-mono text-primary font-semibold px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
            6nm Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cpu?.cores?.map((core) => (
            <div
              key={core.core}
              className={`p-4 rounded-xl border transition-all ${
                core.type === 'performance'
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-secondary/40 border-border/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">{core.name}</span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  core.type === 'performance' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
                }`}>
                  {core.type === 'performance' ? 'Gold' : 'Silver'}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold font-mono text-foreground">
                  {(core.freqMhz / 1000).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">GHz</span>
                </span>
                <span className="text-xs text-muted-foreground font-mono">Max {(core.maxFreqMhz / 1000).toFixed(1)} GHz</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    core.type === 'performance' ? 'bg-primary' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${core.usagePercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory (RAM) & UFS 2.2 Storage Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RAM LPDDR4X */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Bộ Nhớ RAM LPDDR4X</h3>
                <p className="text-xs text-muted-foreground">Tổng bộ nhớ: {memory?.totalMb} MB</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground font-mono">
                {Math.round(((memory?.usedMb || 0) / (memory?.totalMb || 1)) * 100)}%
              </span>
              <span className="text-[10px] text-muted-foreground block">App chiếm dụng</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((memory?.usedMb || 0) / (memory?.totalMb || 1)) * 100)}%` }}
                title="Ứng dụng & HĐH"
              />
              <div
                className="bg-amber-400/70 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((memory?.buffersCachedMb || 0) / (memory?.totalMb || 1)) * 100)}%` }}
                title="Cache / Buffers"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                <span className="text-[11px] text-muted-foreground block flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  App & HĐH
                </span>
                <span className="text-sm font-bold text-primary font-mono">{memory?.usedMb} MB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                <span className="text-[11px] text-muted-foreground block flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Cache / Đệm
                </span>
                <span className="text-sm font-bold text-amber-400 font-mono">{memory?.buffersCachedMb} MB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                <span className="text-[11px] text-muted-foreground block flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  Trống (Free)
                </span>
                <span className="text-sm font-bold text-slate-300 font-mono">{memory?.freeMb} MB</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Khả dụng cho tác vụ mới:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {memory?.availableMb} MB ({Math.round(((memory?.availableMb || 0) / (memory?.totalMb || 1)) * 100)}%)
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground/80 italic text-center leading-tight">
              * App ({memory?.usedMb} MB) + Cache ({memory?.buffersCachedMb} MB) + Trống ({memory?.freeMb} MB) = {memory?.totalMb} MB. Linux tự động giải phóng Cache khi mở thêm app.
            </p>
          </div>
        </div>

        {/* Storage UFS 2.2 */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Bộ Nhớ Trong UFS 2.2</h3>
                <p className="text-xs text-muted-foreground">Phân vùng lưu trữ NAS: {storage?.path}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-foreground font-mono">{storage?.usagePercent}%</span>
          </div>

          <div className="space-y-4">
            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${storage?.usagePercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Tổng bộ nhớ</span>
                <span className="text-sm font-bold text-foreground font-mono">{storage?.totalGb} GB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Đã lưu trữ</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{storage?.usedGb} GB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Còn trống</span>
                <span className="text-sm font-bold text-primary font-mono">{storage?.freeGb} GB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
