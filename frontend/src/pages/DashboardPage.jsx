import React, { useEffect, useState } from 'react';
import { 
  FolderLock, 
  HardDrive, 
  Link2, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  UploadCloud, 
  Lock, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import StatCard from '../components/StatCard';
import FileCard from '../components/FileCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage({ 
  openUploadModal, 
  openAiModal, 
  onShareFile, 
  onHistoryFile, 
  setCurrentTab 
}) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getMyFiles();
      setFiles(res.files || []);
    } catch (err) {
      console.error('Failed to load dashboard files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const activeLinks = files.filter(f => f.shareLink && f.shareLink.token).length;
  const totalDownloads = files.reduce((acc, f) => acc + (f.downloadCount || 0), 0);

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
      fetchDashboardData();
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (file) => {
    if (confirm(`Permanently delete "${file.originalName}" from the encrypted vault?`)) {
      try {
        await api.deleteFile(file._id || file.id);
        fetchDashboardData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Welcome Banner */}
      <div className="glass-card" style={{
        marginBottom: '2rem',
        background: 'var(--banner-bg)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-aes">
                <Lock size={12} /> Military-Grade Encryption
              </span>
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> System Operational
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Welcome back, <span className="text-gradient">{user?.name}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Your files are encrypted in-memory with AES-256-GCM before writing to the vault. No unencrypted plaintext ever touches disk.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              id="dashboard-upload-btn"
              className="btn btn-primary"
              onClick={openUploadModal}
            >
              <UploadCloud size={18} />
              <span>Upload New File</span>
            </button>
            <button
              id="dashboard-ai-btn"
              className="btn btn-secondary"
              onClick={openAiModal}
            >
              <Sparkles size={18} color="#8b5cf6" />
              <span>Ask AI Security</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-stats">
        <StatCard
          title="Total Encrypted Files"
          value={files.length}
          subtitle="Protected with AES-256-GCM"
          icon={FolderLock}
          color="cyan"
        />
        <StatCard
          title="Encrypted Storage"
          value={formatBytes(totalBytes)}
          subtitle="Zero-Knowledge Blob Storage"
          icon={HardDrive}
          color="purple"
        />
        <StatCard
          title="Active Share Links"
          value={activeLinks}
          subtitle="PIN & Expiry Protected"
          icon={Link2}
          color="emerald"
        />
        <StatCard
          title="Total Downloads"
          value={totalDownloads}
          subtitle="Audited in Real-Time"
          icon={Download}
          color="amber"
        />
      </div>

      {/* Security Engine Specs Card */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <ShieldCheck size={20} color="var(--accent-primary)" />
          <span>Active Vault Protection Protocols</span>
        </h3>
        <div className="protocols-grid">
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>AES-256-GCM Cipher</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Authenticated encryption with 16-byte random IV per file to prevent differential cryptanalysis.
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#10b981' }}>SHA-256 Integrity</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Bit-level integrity checksum calculated during upload to guarantee zero file tampering.
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f59e0b' }}>Access Controls & PIN</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Share links can be time-limited (1-168h), locked with 6-digit PINs, and set to burn after 1 download.
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#8b5cf6' }}>Audit Trail Logging</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Every access attempt is permanently tracked with IP address, user-agent, and status verification.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files Section */}
      <div>
        <div className="recent-files-header">
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Recent Encrypted Files</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Files currently stored in your personal encrypted vault</p>
          </div>
          {files.length > 0 && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              onClick={() => setCurrentTab('my-files')}
            >
              <span>View All ({files.length})</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Scanning secure vault ledger...
          </div>
        ) : files.length === 0 ? (
          <div className="glass-card empty-state">
            <UploadCloud size={48} />
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Your Encrypted Vault is Empty</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto', fontSize: '0.85rem' }}>
              Upload your first document or file to encrypt it with AES-256-GCM and store it safely.
            </p>
            <button className="btn btn-primary" onClick={openUploadModal}>
              <UploadCloud size={16} />
              <span>Upload & Encrypt File</span>
            </button>
          </div>
        ) : (
          <div className="grid-files">
            {files.slice(0, 6).map((f) => (
              <FileCard
                key={f._id || f.id}
                file={f}
                onDownload={handleDownload}
                onShare={onShareFile}
                onHistory={onHistoryFile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
