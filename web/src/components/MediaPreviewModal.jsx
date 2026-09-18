import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Film, Music, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getRawUrl } from '../lib/api';
import { formatBytes } from '../lib/utils';

export function MediaPreviewModal({ item, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const rawUrl = getRawUrl(item.path);
  const ext = item.name.split('.').pop()?.toLowerCase() || '';

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isVideo = ['mp4', 'webm', 'ogg', 'mkv', 'mov'].includes(ext);
  const isAudio = ['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(ext);
  const isText = ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'sh', 'py', 'yml', 'yaml', 'env'].includes(ext);

  useEffect(() => {
    if (isText) {
      setLoading(true);
      fetch(rawUrl)
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(() => setContent('Không thể tải nội dung tệp.'))
        .finally(() => setLoading(false));
    }
  }, [item.path, isText, rawUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-secondary/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              {isImage && <ImageIcon className="w-4 h-4" />}
              {isVideo && <Film className="w-4 h-4" />}
              {isAudio && <Music className="w-4 h-4" />}
              {isText && <FileText className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <h3 className="font-semibold text-sm text-foreground truncate">{item.name}</h3>
              <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={rawUrl}
              download={item.name}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải về</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-background/50 min-h-[300px]">
          {isImage && (
            <img
              src={rawUrl}
              alt={item.name}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          )}

          {isVideo && (
            <video
              src={rawUrl}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-lg shadow-lg"
            />
          )}

          {isAudio && (
            <div className="w-full max-w-md p-6 rounded-2xl bg-secondary/40 border border-border/60 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                <Music className="w-10 h-10" />
              </div>
              <h4 className="font-medium text-foreground mb-4 text-sm truncate">{item.name}</h4>
              <audio src={rawUrl} controls autoPlay className="w-full" />
            </div>
          )}

          {isText && (
            <div className="w-full h-full">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <pre className="p-4 rounded-xl bg-secondary/30 border border-border/40 text-xs font-mono text-foreground/90 overflow-x-auto whitespace-pre-wrap max-h-[65vh]">
                  {content}
                </pre>
              )}
            </div>
          )}

          {!isImage && !isVideo && !isAudio && !isText && (
            <div className="text-center p-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium mb-1">Không hỗ trợ xem trước định dạng này</p>
              <p className="text-xs text-muted-foreground mb-4">Mày có thể tải tệp tin về máy để mở.</p>
              <a
                href={rawUrl}
                download={item.name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp tin</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
