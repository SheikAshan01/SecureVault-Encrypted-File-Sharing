import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle, Clock, Globe, RefreshCw, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const actionOptions = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'DOWNLOAD', label: 'Downloads' },
  { value: 'UPLOAD', label: 'Uploads' },
  { value: 'SHARE_CREATED', label: 'Shares Created' },
  { value: 'ACCESS_DENIED', label: 'Access Denied' },
];

const formatIp = (ip) => {
  if (!ip || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1 (Localhost)';
  }
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // If admin, fetch global logs; otherwise, fetch files and their history
      if (user?.role === 'admin') {
        const res = await api.getAdminLogs(100);
        setLogs(res.logs || []);
      } else {
        const resFiles = await api.getMyFiles();
        const myFiles = resFiles.files || [];
        let combined = [];
        for (const file of myFiles) {
          try {
            const hRes = await api.getFileHistory(file._id || file.id);
            combined = [...combined, ...(hRes.logs || [])];
          } catch (e) {}
        }
        // sort descending
        combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(combined);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const filteredLogs = logs.filter((l) => {
    if (filterAction === 'ALL') return true;
    return l.action === filterAction;
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <History size={26} color="var(--cyan-primary)" />
            <span>Download & Audit Trail Ledger</span>
          </h1>
          <p className="page-subtitle">
            Cryptographically tracked audit logs for all uploads, downloads, sharing grants, and access denials.
          </p>
        </div>

        <div className="header-action-group">
          <CustomSelect
            id="audit-filter-select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            options={actionOptions}
            style={{ minWidth: '150px' }}
          />

          <button className="btn btn-secondary" onClick={fetchLogs}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Retrieving audit records from the ledger...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card empty-state">
          <History size={44} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Audit Entries Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Actions like file uploads, downloads, and link creations will be recorded here in real-time.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>File / Resource</th>
                <th>Action</th>
                <th>Accessor</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id || log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {log.fileName || 'System / Auth'}
                  </td>
                  <td>
                    <span className={
                      log.action === 'DOWNLOAD' ? 'badge badge-success' :
                      log.action === 'ACCESS_DENIED' ? 'badge badge-danger' :
                      log.action === 'UPLOAD' ? 'badge badge-aes' :
                      'badge badge-purple'
                    }>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {log.userEmail}
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
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
