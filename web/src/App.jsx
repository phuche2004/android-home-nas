import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FileExplorer } from './components/FileExplorer';
import { DeviceMonitor } from './components/DeviceMonitor';
import { SettingsManager } from './components/SettingsManager';
import { LoginModal } from './components/LoginModal';
import { auth } from './lib/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
  const [user, setUser] = useState(auth.getUser());
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'telemetry' | 'settings'

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    auth.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8 flex-1 max-w-7xl">
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'telemetry' && <DeviceMonitor />}
        {activeTab === 'settings' && <SettingsManager user={user} />}
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>Project Spes-NAS • Qualcomm Snapdragon 680 (6nm) • Redmi Note 11</p>
      </footer>
    </div>
  );
}
