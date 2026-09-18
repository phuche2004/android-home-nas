import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, FileText, Image as ImageIcon, Film, Music, Download, Trash2,
  Edit2, Share2, Plus, Upload, RefreshCw, Eye, ChevronRight, Home,
  Search, LayoutGrid, List, AlertCircle, Check, Loader2
} from 'lucide-react';
import { fetchResources, uploadFile, createFolder, deleteResource, renameResource, getRawUrl } from '../lib/api';
import { formatBytes, formatDate } from '../lib/utils';
import { MediaPreviewModal } from './MediaPreviewModal';

export function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals & Actions
  const [previewItem, setPreviewItem] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [itemToRename, setItemToRename] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // { name, percent }

  const fileInputRef = useRef(null);

  const loadDirectory = async (path = currentPath) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchResources(path);
      setItems(data.items || []);
      setCurrentPath(data.path || path);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách tệp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  // Handle Breadcrumb clicks
  const navigateTo = (path) => {
    setCurrentPath(path);
  };

  const breadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'Trang chủ', path: '/' }];
    let accumulated = '';
    for (const part of parts) {
      accumulated += `/${part}`;
      crumbs.push({ name: part, path: accumulated });
    }
    return crumbs;
  };

  // Upload handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ name: file.name, percent: 0 });
      try {
        await uploadFile(currentPath, file, (percent) => {
          setUploadProgress({ name: file.name, percent });
        });
      } catch (err) {
        alert(`Lỗi khi tải lên ${file.name}: ${err.message}`);
      }
    }
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadDirectory();
  };

  // Create Folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createFolder(currentPath, newFolderName.trim());
      setShowNewFolderModal(false);
      setNewFolderName('');
      loadDirectory();
    } catch (err) {
      alert(err.message);
    }
  };

  // Rename
  const handleRename = async (e) => {
    e.preventDefault();
    if (!itemToRename || !renameValue.trim()) return;
    try {
      await renameResource(itemToRename.path, renameValue.trim());
      setItemToRename(null);
      loadDirectory();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteResource(itemToDelete.path);
      setItemToDelete(null);
      loadDirectory();
    } catch (err) {
      alert(err.message);
    }
  };

  // Icon selector
  const getFileIcon = (item) => {
    if (item.isDir) return <Folder className="w-8 h-8 text-primary fill-primary/20" />;
    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-8 h-8 text-rose-400" />;
    }
    if (['mp4', 'mkv', 'webm', 'mov'].includes(ext)) {
      return <Film className="w-8 h-8 text-indigo-400" />;
    }
    if (['mp3', 'wav', 'flac'].includes(ext)) {
      return <Music className="w-8 h-8 text-amber-400" />;
    }
    return <FileText className="w-8 h-8 text-slate-400" />;
  };

  // Filter items
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-sm font-medium">
          {breadcrumbs().map((crumb, idx, arr) => (
            <React.Fragment key={crumb.path}>
              <button
                onClick={() => navigateTo(crumb.path)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  idx === arr.length - 1
                    ? 'text-foreground font-semibold bg-secondary/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {idx === 0 && <Home className="w-3.5 h-3.5" />}
                <span>{crumb.name}</span>
              </button>
              {idx < arr.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tệp..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-secondary/50 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all"
            />
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title="Đổi kiểu hiển thị"
            className="p-2 rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>

          <button
            onClick={() => loadDirectory()}
            title="Làm mới thư mục"
            className="p-2 rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border hover:bg-secondary/80 text-foreground text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thư mục mới</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer shadow-md shadow-primary/20 active:scale-95 transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Tải lên</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-foreground flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            <span className="text-xs font-medium truncate">Đang tải lên: {uploadProgress.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-primary">{uploadProgress.percent}%</span>
          </div>
        </div>
      )}

      {/* Main Files Display */}
      {error ? (
        <div className="p-12 text-center rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : filteredItems.length === 0 && !loading ? (
        <div className="p-16 text-center rounded-2xl bg-card border border-border">
          <Folder className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">Thư mục này còn trống</h3>
          <p className="text-xs text-muted-foreground">Kéo thả tệp vào đây hoặc nhấn nút "Tải lên" để thêm file mới.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.path}
              onDoubleClick={() => item.isDir ? navigateTo(item.path) : setPreviewItem(item)}
              className="group p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-200 flex flex-col justify-between cursor-pointer relative"
            >
              <div className="flex flex-col items-center text-center py-4">
                <div className="mb-3 transform group-hover:scale-110 transition-transform duration-200">
                  {getFileIcon(item)}
                </div>
                <span className="text-xs font-medium text-foreground line-clamp-2 break-all w-full title={item.name}">
                  {item.name}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {item.isDir ? `${item.numFiles || 0} mục` : formatBytes(item.size)}
                </span>
              </div>

              {/* Action Buttons on Hover */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!item.isDir && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                      title="Xem trước"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={getRawUrl(item.path)}
                      download={item.name}
                      onClick={(e) => e.stopPropagation()}
                      title="Tải về"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToRename(item);
                    setRenameValue(item.name);
                  }}
                  title="Đổi tên"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                  title="Xóa"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border/60 text-muted-foreground font-medium">
              <tr>
                <th className="py-3 px-4">Tên tệp</th>
                <th className="py-3 px-4 hidden sm:table-cell">Kích thước</th>
                <th className="py-3 px-4 hidden md:table-cell">Cập nhật</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredItems.map((item) => (
                <tr
                  key={item.path}
                  onDoubleClick={() => item.isDir ? navigateTo(item.path) : setPreviewItem(item)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {item.isDir ? <Folder className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <span className="font-medium text-foreground truncate max-w-xs sm:max-w-md">{item.name}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono hidden sm:table-cell">
                    {item.isDir ? '---' : formatBytes(item.size)}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                    {formatDate(item.modified)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!item.isDir && (
                        <>
                          <button
                            onClick={() => setPreviewItem(item)}
                            title="Xem trước"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={getRawUrl(item.path)}
                            download={item.name}
                            title="Tải về"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => { setItemToRename(item); setRenameValue(item.name); }}
                        title="Đổi tên"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        title="Xóa"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: New Folder */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border shadow-2xl">
            <h3 className="text-base font-semibold text-foreground mb-4">Tạo Thư Mục Mới</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nhập tên thư mục"
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm outline-none focus:border-primary"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                >
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename */}
      {itemToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border shadow-2xl">
            <h3 className="text-base font-semibold text-foreground mb-4">Đổi Tên Tệp / Thư Mục</h3>
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm outline-none focus:border-primary"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemToRename(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-destructive/30 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground mb-2">Xác nhận xóa</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Mày có chắc chắn muốn xóa <span className="font-semibold text-foreground">"{itemToDelete.name}"</span>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {previewItem && (
        <MediaPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}
