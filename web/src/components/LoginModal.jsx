import React, { useState } from 'react';
import { HardDrive, Lock, User, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { login } from '../lib/api';

export function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('0912856050');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user } = await login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md p-8 rounded-2xl bg-card/90 border border-border shadow-2xl shadow-primary/5 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/10">
            <HardDrive className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Spes Home NAS</h2>
          <p className="text-xs text-muted-foreground mt-1">Đăng nhập vào máy chủ lưu trữ Redmi Note 11</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Tài khoản</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/50 border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/50 border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Truy cập hệ thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[11px] text-muted-foreground border-t border-border/40 pt-4">
          Bảo mật bởi Cloudflare Zero Trust & Tailscale Mesh
        </div>
      </div>
    </div>
  );
}
