import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  Archive, 
  Download, 
  Share2, 
  History, 
  Trash2, 
  Lock, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  Key,
  Clock,
  RotateCw 
} from 'lucide-react';

export default function FileCard({ file, onDownload, onShare, onHistory, onDelete, isSharedWithMe = false }) {
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime = '', name = '') => {
    if (mime.includes('image') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)) {
      return <ImageIcon size={22} color="#00f2fe" />;
    }
    if (mime.includes('zip') || mime.includes('tar') || /\.(zip|rar|7z|tar|gz)$/i.test(name)) {
      return <Archive size={22} color="#f59e0b" />;
    }
    if (mime.includes('javascript') || mime.includes('json') || /\.(js|jsx|ts|tsx|py|html|css)$/i.test(name)) {
      return <FileCode size={22} color="#10b981" />;
    }
    return <FileText size={22} color="#8b5cf6" />;
  };

  const formatFullDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart} at ${timePart}`;
  };

  const isUpdated = file.updatedAt && (new Date(file.updatedAt).getTime() - new Date(file.createdAt).getTime() > 1000);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Top row: Icon + Security Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {getFileIcon(file.mimeType, file.originalName)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0, maxWidth: '65%' }}>
          {file.securityLevel === 'top-secret' && (
            <span className="badge badge-danger">
              <ShieldAlert size={11} /> Top-Secret
            </span>
          )}
          {file.securityLevel === 'standard' && (
            <span className="badge badge-success">
              <Shield size={11} /> Standard (AES-256)
            </span>
          )}
          {(file.securityLevel === 'confidential' || !file.securityLevel) && (
            <span className="badge badge-aes">
              <Lock size={11} /> Confidential (GCM)
            </span>
          )}
          {file.shareLink?.token && (
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
              Public Link Active
            </span>
          )}
        </div>
      </div>

      {/* File Name & Classification */}
      <div style={{ marginBottom: '1rem', flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700,
          fontSize: '1rem',
          color: 'var(--text-primary)',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          lineHeight: 1.4,
          marginBottom: '0.35rem',
        }}>
          {file.originalName}
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginTop: '0.35rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatBytes(file.sizeBytes)}
            </span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
              <Clock size={12} color="var(--accent-primary)" />
              <span>Created: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatFullDateTime(file.createdAt)}</strong></span>
            </span>
          </div>

          {isUpdated && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.74rem',
              color: 'var(--purple-primary)',
              background: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.22)',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              width: 'fit-content',
              fontWeight: 600,
            }}>
              <RotateCw size={11} />
              <span>Updated: {formatFullDateTime(file.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cryptographic Checksum Snippet */}
      <div style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.55rem 0.75rem',
        marginBottom: '1rem',
        fontSize: '0.75rem',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ShieldCheck size={12} color="#10b981" />
          <span>SHA-256 Checksum:</span>
        </div>
        <div className="mono-hash" style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          display: 'block',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {file.sha256Checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4...'}
        </div>
      </div>

      {/* Meta Stats & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        paddingTop: '0.85rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Downloads: <strong style={{ color: 'var(--text-primary)' }}>{file.downloadCount || 0}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            className="btn-icon"
            onClick={() => onDownload(file)}
            title="Decrypt & Download"
          >
            <Download size={16} />
          </button>

          {!isSharedWithMe && (
            <>
              <button
                className="btn-icon"
                onClick={() => onShare(file)}
                title="Share & Permissions"
              >
                <Share2 size={16} />
              </button>

              <button
                className="btn-icon"
                onClick={() => onHistory(file)}
                title="View Download Logs"
              >
                <History size={16} />
              </button>

              <button
                className="btn-icon"
                style={{ color: '#fb7185' }}
                onClick={() => onDelete(file)}
                title="Permanently Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
