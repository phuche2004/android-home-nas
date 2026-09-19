import React from 'react';
import { HardDrive, Cpu, LogOut, User, Sparkles, Wifi, Settings, Shield } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground text-base">Spes NAS</span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Snapdragon 680 | Redmi Note 11</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'files'
                ? 'bg-card text-foreground shadow-sm shadow-black/40 border border-border/60 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Tệp tin</span>
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'telemetry'
                ? 'bg-card text-foreground shadow-sm shadow-black/40 border border-border/60 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Phần cứng</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-card text-foreground shadow-sm shadow-black/40 border border-border/60 font-semibold text-amber-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Cài đặt</span>
          </button>
        </nav>

        {/* User & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 bg-secondary/40 hover:bg-secondary/70 border border-border/40 py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
            title="Cài đặt tài khoản"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-medium text-foreground hidden md:inline">{user?.username}</span>
            {user?.perm?.admin && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase">
                Admin
              </span>
            )}
          </button>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
