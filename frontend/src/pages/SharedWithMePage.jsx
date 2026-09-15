import React, { useState, useEffect } from 'react';
import { Share2, Download, Eye, RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SharedWithMePage() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShared = async () => {
    try {
      setLoading(true);
      const res = await api.getSharedWithMe();
      setFiles(res.files || []);
    } catch (err) {
      console.error('Failed to load shared files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShared();
  }, []);

  const handleDownload = async (file) => {
    try {
      const blob = await api.downloadFile(file._id || file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      fetchShared();
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Share2 size={26} color="var(--cyan-primary)" />
            <span>Shared With Me</span>
          </h1>
          <p className="page-subtitle">
            Files shared directly with your account ({user?.email}) by other vault members.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchShared}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Checking authorized inbound file shares...
        </div>
      ) : files.length === 0 ? (
        <div className="glass-card empty-state">
          <Share2 size={44} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Shared Files</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            When another user grants you access to their encrypted files, they will appear here.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Owner</th>
                <th>Size</th>
                <th>Security</th>
                <th>My Permission</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const userPermission = (f.sharedWith || []).find(
                  (s) => s.email.toLowerCase() === user?.email?.toLowerCase()
                )?.permission || 'download';

                return (
                  <tr key={f._id || f.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.originalName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Created: {new Date(f.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {f.ownerEmail}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatBytes(f.sizeBytes)}
                    </td>
                    <td>
                      <span className="badge badge-aes">
                        <Lock size={10} /> AES-256-GCM
                      </span>
                    </td>
                    <td>
                      <span className={userPermission === 'download' ? 'badge badge-success' : 'badge badge-warning'}>
                        {userPermission === 'download' ? 'Download & View' : 'View Only'}
                      </span>
                    </td>
                    <td>
                      {userPermission === 'download' ? (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleDownload(f)}
                        >
                          <Download size={14} />
                          <span>Decrypt & Save</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Eye size={14} /> View Only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
