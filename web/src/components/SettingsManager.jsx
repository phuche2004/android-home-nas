import React, { useState, useEffect } from 'react';
import {
  Settings, User, Users, Key, Shield, Folder, Plus, Trash2,
  Edit, Check, Lock, Sliders, UserPlus, AlertCircle, Save,
  CheckCircle2, RefreshCw
} from 'lucide-react';
import {
  fetchUsers, createUser, updateUser, deleteUser,
  fetchSettings, updateSettings
} from '../lib/api';

export function SettingsManager({ user }) {
  const isAdmin = !!user?.perm?.admin;
  const [activeSubTab, setActiveSubTab] = useState('profile');

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const [adminAuthPassword, setAdminAuthPassword] = useState('');
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    scope: '/',
    isAdmin: false,
    create: true,
    modify: true,
    delete: true,
    download: true,
    share: true
  });
  const [userFormError, setUserFormError] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const [systemSettings, setSystemSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadUsersData = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const list = await fetchUsers();
      setUsersList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSystemSettingsData = async () => {
    if (!isAdmin) return;
    setLoadingSettings(true);
    try {
      const data = await fetchSettings();
      setSystemSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users') loadUsersData();
    if (activeSubTab === 'system') loadSystemSettingsData();
  }, [activeSubTab]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (!newPassword || newPassword.length < 4) {
      setProfileMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 4 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'Xác nhận mật khẩu không trùng khớp.' });
      return;
    }

    setSavingPassword(true);
    try {
      await updateUser(
        user.id,
        ['password'],
        { password: newPassword },
        currentPassword
      );
      setProfileMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Đổi mật khẩu thất bại.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOpenCreateUser = () => {
    setUserModalMode('create');
    setUserForm({
      username: '',
      password: '',
      scope: '/',
      isAdmin: false,
      create: true,
      modify: true,
      delete: true,
      download: true,
      share: true
    });
    setAdminAuthPassword('');
    setUserFormError('');
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setUserModalMode('edit');
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: '',
      scope: u.scope || '/',
      isAdmin: !!u.perm?.admin,
      create: !!u.perm?.create,
      modify: !!u.perm?.modify,
      delete: !!u.perm?.delete,
      download: !!u.perm?.download,
      share: !!u.perm?.share
    });
    setAdminAuthPassword('');
    setUserFormError('');
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserFormError('');

    if (userModalMode === 'create' && !userForm.username) {
      setUserFormError('Vui lòng nhập tên người dùng.');
      return;
    }
    if (userModalMode === 'create' && !userForm.password) {
      setUserFormError('Vui lòng nhập mật khẩu cho người dùng mới.');
      return;
    }
    if (!adminAuthPassword) {
      setUserFormError('Vui lòng nhập mật khẩu tài khoản Admin của bạn để xác thực thay đổi.');
      return;
    }

    setSavingUser(true);
    try {
      if (userModalMode === 'create') {
        const payload = {
          username: userForm.username,
          password: userForm.password,
          scope: userForm.scope || '/',
          locale: 'vi',
          lockPassword: false,
          viewMode: 'list',
          singleClick: false,
          perm: {
            admin: userForm.isAdmin,
            execute: userForm.isAdmin,
            create: userForm.create,
            rename: userForm.modify,
            modify: userForm.modify,
            delete: userForm.delete,
            share: userForm.share,
            download: userForm.download
          },
          commands: [],
          rules: []
        };
        await createUser(payload, adminAuthPassword);
      } else {
        const which = ['perm', 'scope'];
        const data = {
          ...editingUser,
          scope: userForm.scope || '/',
          perm: {
            ...editingUser.perm,
            admin: userForm.isAdmin,
            execute: userForm.isAdmin,
            create: userForm.create,
            rename: userForm.modify,
            modify: userForm.modify,
            delete: userForm.delete,
            share: userForm.share,
            download: userForm.download
          }
        };
        if (userForm.password) {
          which.push('password');
          data.password = userForm.password;
        }
        await updateUser(editingUser.id, which, data, adminAuthPassword);
      }
      setUserModalOpen(false);
      loadUsersData();
    } catch (err) {
      setUserFormError(err.message || 'Thao tác người dùng thất bại.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${targetUser.username}"?`)) {
      return;
    }
    try {
      await deleteUser(targetUser.id);
      loadUsersData();
    } catch (err) {
      alert(err.message || 'Xóa người dùng thất bại.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsMsg({ type: '', text: '' });
    setSavingSettings(true);
    try {
      await updateSettings(
        ['signup', 'createUserDir', 'minimumPasswordLength'],
        systemSettings
      );
      setSettingsMsg({ type: 'success', text: 'Cài đặt hệ thống đã được cập nhật thành công!' });
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message || 'Lưu cài đặt thất bại.' });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Cài Đặt & Quản Trị Hệ Thống</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tùy chỉnh tài khoản cá nhân, phân quyền thư mục và quản lý toàn bộ hệ thống NAS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border/60">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeSubTab === 'profile'
                ? 'bg-card text-foreground shadow-sm border border-border/80 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Hồ Sơ & Mật Khẩu</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveSubTab('users')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeSubTab === 'users'
                    ? 'bg-card text-foreground shadow-sm border border-border/80 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Người Dùng</span>
              </button>

              <button
                onClick={() => setActiveSubTab('system')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeSubTab === 'system'
                    ? 'bg-card text-foreground shadow-sm border border-border/80 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Cấu Hình NAS</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/60">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                {user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{user?.username}</h3>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  isAdmin
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-secondary text-muted-foreground border border-border'
                }`}>
                  <Shield className="w-3 h-3" />
                  {isAdmin ? 'Quản Trị Viên (Admin)' : 'Thành Viên Tiêu Chuẩn'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">ID Tài khoản:</span>
                <span className="font-mono text-foreground">{user?.id || 1}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Thư mục giới hạn (Scope):</span>
                <span className="font-mono text-foreground">{user?.scope || '/'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Ngôn ngữ mặc định:</span>
                <span className="text-foreground uppercase font-mono">{user?.locale || 'vi'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-foreground block mb-2">Quyền Hạn Được Cấp:</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(user?.perm || {}).map(([key, val]) => (
                  <span
                    key={key}
                    className={`text-[10px] px-2 py-1 rounded-md font-mono flex items-center gap-1 border ${
                      val
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-secondary/40 text-muted-foreground/50 border-border/40 line-through'
                    }`}
                  >
                    {val ? <Check className="w-2.5 h-2.5" /> : null}
                    {key}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
              <Key className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-foreground text-sm">Đổi Mật Khẩu Tài Khoản</h3>
            </div>

            {profileMsg.text && (
              <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Mật Khẩu Hiện Tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Mật Khẩu Mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 4 ký tự"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Xác Nhận Mật Khẩu Mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Cập Nhật Mật Khẩu</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {isAdmin && activeSubTab === 'users' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Danh Sách Người Dùng Hệ Thống
              </h3>
              <p className="text-xs text-muted-foreground">Phân quyền tài khoản truy cập và giới hạn thư mục trên ổ cứng</p>
            </div>

            <button
              onClick={handleOpenCreateUser}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Người Dùng</span>
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span>Đang tải danh sách người dùng...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-medium">
                    <th className="pb-3 px-3">Tài Khoản</th>
                    <th className="pb-3 px-3">Vai Trò</th>
                    <th className="pb-3 px-3">Thư Mục (Scope)</th>
                    <th className="pb-3 px-3">Quyền Hạn</th>
                    <th className="pb-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {usersList.map((u) => {
                    const isSelf = u.id === user.id;
                    return (
                      <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-foreground font-mono">{u.username}</span>
                              {isSelf && (
                                <span className="text-[10px] text-primary ml-1.5 font-sans">(Bạn)</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            u.perm?.admin
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-secondary text-muted-foreground border border-border'
                          }`}>
                            {u.perm?.admin ? 'Admin' : 'Thành viên'}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-muted-foreground">{u.scope || '/'}</td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {u.perm?.create && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground">Tạo</span>}
                            {u.perm?.modify && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground">Sửa</span>}
                            {u.perm?.delete && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground">Xóa</span>}
                            {u.perm?.download && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground">Tải</span>}
                            {u.perm?.share && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground">Chia sẻ</span>}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all"
                              title="Chỉnh sửa phân quyền"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isAdmin && activeSubTab === 'system' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl max-w-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/60">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-foreground text-base">Cấu Hình Máy Chủ NAS Toàn Cục</h3>
              <p className="text-xs text-muted-foreground">Thiết lập quy tắc đăng ký tài khoản và thư mục lưu trữ hệ thống</p>
            </div>
          </div>

          {settingsMsg.text && (
            <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
              settingsMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {settingsMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{settingsMsg.text}</span>
            </div>
          )}

          {loadingSettings || !systemSettings ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span>Đang đọc cấu hình máy chủ...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Đăng Ký Tài Khoản Tự Do</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Cho phép người truy cập từ bên ngoài tự tạo tài khoản mới trên trang đăng nhập
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!systemSettings.signup}
                  onChange={(e) => setSystemSettings({ ...systemSettings, signup: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/60">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Tự Động Tạo Thư Mục Người Dùng</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Tạo sẵn thư mục riêng biệt cho mỗi tài khoản mới đăng ký
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!systemSettings.createUserDir}
                  onChange={(e) => setSystemSettings({ ...systemSettings, createUserDir: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Độ Dài Mật Khẩu Tối Thiểu
                </label>
                <input
                  type="number"
                  min="4"
                  max="32"
                  value={systemSettings.minimumPasswordLength || 4}
                  onChange={(e) => setSystemSettings({ ...systemSettings, minimumPasswordLength: parseInt(e.target.value, 10) || 4 })}
                  className="w-32 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="py-2.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Lưu Cài Đặt Hệ Thống</span>
              </button>
            </form>
          )}
        </div>
      )}

      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                {userModalMode === 'create' ? 'Thêm Người Dùng Mới' : `Sửa Người Dùng: ${editingUser?.username}`}
              </h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {userFormError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              {userModalMode === 'create' && (
                <div>
                  <label className="text-muted-foreground font-medium block mb-1">Tên Đăng Nhập</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="vd: phuche"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-muted-foreground font-medium block mb-1">
                  {userModalMode === 'create' ? 'Mật Khẩu' : 'Mật Khẩu Mới (để trống nếu không đổi)'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Mật khẩu tài khoản"
                  required={userModalMode === 'create'}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-muted-foreground font-medium block mb-1">Thư Mục Phạm Vi (Scope)</label>
                <input
                  type="text"
                  value={userForm.scope}
                  onChange={(e) => setUserForm({ ...userForm, scope: e.target.value })}
                  placeholder="/"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2">
                <span className="font-semibold text-foreground block mb-1">Phân Quyền:</span>

                <label className="flex items-center gap-2 text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.isAdmin}
                    onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-primary">Toàn quyền Quản trị viên (Admin)</span>
                </label>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={userForm.create}
                      onChange={(e) => setUserForm({ ...userForm, create: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Tạo tệp / thư mục</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={userForm.modify}
                      onChange={(e) => setUserForm({ ...userForm, modify: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Sửa / Đổi tên</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={userForm.delete}
                      onChange={(e) => setUserForm({ ...userForm, delete: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Xóa tệp</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={userForm.download}
                      onChange={(e) => setUserForm({ ...userForm, download: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Tải về</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={userForm.share}
                      onChange={(e) => setUserForm({ ...userForm, share: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Chia sẻ link</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <label className="text-destructive font-medium block mb-1">
                  Mật Khẩu Admin Của Bạn (để xác nhận) *
                </label>
                <input
                  type="password"
                  value={adminAuthPassword}
                  onChange={(e) => setAdminAuthPassword(e.target.value)}
                  placeholder="Nhập mật khẩu tài khoản của bạn"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{userModalMode === 'create' ? 'Tạo Người Dùng' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
