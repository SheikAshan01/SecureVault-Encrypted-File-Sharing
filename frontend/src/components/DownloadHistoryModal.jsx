import React, { useEffect, useState } from 'react';
import { X, History, ShieldAlert, CheckCircle, Clock, Globe } from 'lucide-react';
import { api } from '../services/api';

const formatIp = (ip) => {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1 (Localhost)';
  }
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
};

export default function DownloadHistoryModal({ isOpen, file, onClose }) {
  if (!isOpen || !file) return null;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await api.getFileHistory(file._id || file.id);
        setLogs(res.logs || []);
      } catch (err) {
        console.error('Failed to load file history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [file]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-primary)',
            }}>
              <History size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Audit Trail & Download History</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {file.originalName} ({file.downloadCount || 0} total downloads)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Querying blockchain & database audit records...
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <History size={40} />
              <p>No downloads or access records logged yet for this file.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Accessor</th>
                    <th>Action</th>
                    <th>IP Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id || log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {log.userEmail}
                      </td>
                      <td>
                        <span className={
                          log.action === 'DOWNLOAD' ? 'badge badge-success' :
                          log.action === 'ACCESS_DENIED' ? 'badge badge-danger' :
                          'badge badge-aes'
                        }>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Globe size={13} />
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{formatIp(log.ipAddress)}</span>
                        </div>
                      </td>
                      <td>
                        {log.status === 'SUCCESS' ? (
                          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                            <CheckCircle size={14} /> Success
                          </span>
                        ) : (
                          <span style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                            <ShieldAlert size={14} /> Denied
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
