import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  HardDrive, 
  FolderLock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Lock 
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [mRes, uRes, fRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminFiles(),
      ]);
      setMetrics(mRes.metrics);
      setUsers(uRes.users || []);
      setFiles(fRes.files || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUser = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (confirm(`Admin Action: Permanently destroy file "${fileName}" from vault?`)) {
      try {
        await api.deleteFile(fileId);
        fetchAdminData();
      } catch (err) {
        alert(err.message);
      }
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
            <ShieldAlert size={26} color="#f59e0b" />
            <span>Admin Security Command Center</span>
          </h1>
          <p className="page-subtitle">
            System governance, user authorization controls, and global cryptographic ledger monitoring.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchAdminData}>
          <RefreshCw size={16} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Stats row */}
      {metrics && (
        <div className="grid-stats">
          <StatCard
            title="Total Registered Users"
            value={metrics.totalUsers}
            subtitle="Governed by RBAC"
            icon={Users}
            color="cyan"
          />
          <StatCard
            title="Encrypted Files in Vault"
            value={metrics.totalFiles}
            subtitle="AES-256-GCM Blobs"
            icon={FolderLock}
            color="purple"
          />
          <StatCard
            title="Total Vault Storage"
            value={formatBytes(metrics.totalStorageBytes)}
            subtitle="Hardware Encrypted"
            icon={HardDrive}
            color="emerald"
          />
          <StatCard
            title="Security Alerts (Access Denied)"
            value={metrics.securityAlerts}
            subtitle="Blocked Intrusion Attempts"
            icon={AlertTriangle}
            color="rose"
          />
        </div>
      )}

      {/* User Governance Table */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--cyan-primary)" />
          <span>User Access Control & Governance</span>
        </h3>

        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Access Role</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <select
                      className="form-select"
                      style={{ width: '110px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id || u.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    {u.isActive !== false ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <XCircle size={12} /> Suspended
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={u.isActive !== false ? 'btn btn-danger' : 'btn btn-cyber'}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => handleToggleUser(u._id || u.id)}
                    >
                      {u.isActive !== false ? 'Suspend Account' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global File Ledger */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderLock size={18} color="var(--purple-primary)" />
          <span>Global Encrypted File Ledger</span>
        </h3>

        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Original Name</th>
                <th>Owner Email</th>
                <th>Size</th>
                <th>SHA-256 Checksum</th>
                <th>Downloads</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f._id || f.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.originalName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Created: {new Date(f.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.ownerEmail}</td>
                  <td style={{ fontSize: '0.85rem' }}>{formatBytes(f.sizeBytes)}</td>
                  <td className="mono-hash">{f.sha256Checksum?.substring(0, 16)}...</td>
                  <td>{f.downloadCount || 0}</td>
                  <td>
                    <button
                      className="btn-icon"
                      style={{ color: '#fb7185' }}
                      title="Destroy File"
                      onClick={() => handleDeleteFile(f._id || f.id, f.originalName)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
