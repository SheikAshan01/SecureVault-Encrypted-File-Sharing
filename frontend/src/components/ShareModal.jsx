import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Link2, 
  UserPlus, 
  Trash2, 
  Copy, 
  Check, 
  KeyRound, 
  Clock, 
  Eye, 
  DownloadCloud, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import CustomSelect from './CustomSelect';

const expiryOptions = [
  { value: '1', label: '1 Minute' },
  { value: '5', label: '5 Minutes' },
  { value: '10', label: '10 Minutes' },
  { value: '60', label: '1 Hour' },
  { value: '1440', label: '24 Hours (1 Day)' },
  { value: '4320', label: '72 Hours (3 Days)' },
  { value: '10080', label: '7 Days' },
  { value: 'custom', label: 'Custom Duration...' },
  { value: '0', label: 'Never (Permanent)' },
];

const maxDownloadOptions = [
  { value: '0', label: 'Unlimited' },
  { value: '1', label: '1-Time Burn Link' },
  { value: '5', label: 'Up to 5 Downloads' },
  { value: '10', label: 'Up to 10 Downloads' },
];

const customUnitOptions = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const permissionOptions = [
  { value: 'download', label: 'Download' },
  { value: 'view', label: 'View Only' },
];

export default function ShareModal({ isOpen, file, onClose, onUpdated }) {
  if (!isOpen || !file) return null;

  // Keep a reactive local copy of file so UI updates immediately when a link is generated or revoked
  const [currentFile, setCurrentFile] = useState(file);

  useEffect(() => {
    if (file) {
      setCurrentFile(file);
      setIsProtected(file.shareLink?.isProtected || false);
      setPin(file.shareLink?.pin || '');
    }
  }, [file]);

  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'users'
  const [recipientEmail, setRecipientEmail] = useState('');
  const [userPermission, setUserPermission] = useState('download');
  
  // Public Link settings
  const hasExistingLink = Boolean(currentFile.shareLink && currentFile.shareLink.token);
  const [isProtected, setIsProtected] = useState(file.shareLink?.isProtected || false);
  const [pin, setPin] = useState(file.shareLink?.pin || '');
  const [expiryPreset, setExpiryPreset] = useState('1440');
  const [customValue, setCustomValue] = useState('10');
  const [customUnit, setCustomUnit] = useState('minutes');
  const [maxDownloads, setMaxDownloads] = useState('0');

  const formatExpiryDisplay = (isoString) => {
    if (!isoString) return 'Never (Permanent)';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (diffMins < 1) {
      return `${timeStr} (< 1m left)`;
    } else if (diffMins < 60) {
      return `${timeStr} (${diffMins}m left)`;
    } else if (diffHours < 24) {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr} (${diffHours}h left)`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${timeStr}`;
  };
  
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const publicUrl = currentFile.shareLink?.token
    ? `${window.location.origin}/#download/${currentFile.shareLink.token}`
    : '';

  const copyToClipboard = (textToCopy) => {
    const text = textToCopy || publicUrl;
    if (!text) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleShareWithUser = async (e) => {
    e.preventDefault();
    if (!recipientEmail) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.shareWithUser(currentFile._id || currentFile.id, recipientEmail, userPermission);
      setCurrentFile(res.file);
      setMessage(`Access granted to ${recipientEmail}`);
      setRecipientEmail('');
      if (onUpdated) onUpdated(res.file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (email) => {
    setLoading(true);
    try {
      const res = await api.removeSharedUser(currentFile._id || currentFile.id, email);
      setCurrentFile(res.file);
      setMessage(`Removed access for ${email}`);
      if (onUpdated) onUpdated(res.file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const generatedPin = isProtected ? (pin || Math.floor(100000 + Math.random() * 900000).toString()) : null;

      let totalMinutes = 0;
      if (expiryPreset === 'custom') {
        const val = Number(customValue) || 1;
        if (customUnit === 'minutes') {
          totalMinutes = val;
        } else if (customUnit === 'hours') {
          totalMinutes = val * 60;
        } else if (customUnit === 'days') {
          totalMinutes = val * 1440;
        }
      } else {
        totalMinutes = Number(expiryPreset) || 0;
      }

      const res = await api.generatePublicLink(currentFile._id || currentFile.id, {
        pin: generatedPin,
        expiresHours: totalMinutes > 0 ? (totalMinutes / 60) : 0,
        expiresMinutes: totalMinutes,
        maxDownloads: Number(maxDownloads),
        allowDownload: true,
      });

      // Update state immediately so the "Active Sharing Link" view appears
      setCurrentFile(res.file);
      setMessage('Secure share link created successfully! Link copied to clipboard.');
      
      const newUrl = `${window.location.origin}/#download/${res.shareLink.token}`;
      copyToClipboard(newUrl);

      if (onUpdated) onUpdated(res.file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    setLoading(true);
    try {
      const res = await api.revokePublicLink(currentFile._id || currentFile.id);
      setCurrentFile(res.file);
      setMessage('Public share link revoked.');
      if (onUpdated) onUpdated(res.file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Manage Sharing & Access</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentFile.originalName}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
        }}>
          <button
            id="tab-share-link"
            style={{
              flex: 1,
              padding: '0.85rem',
              background: 'none',
              border: 'none',
              color: activeTab === 'link' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'link' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
            onClick={() => setActiveTab('link')}
          >
            <Link2 size={16} />
            <span>Secure Link & PIN</span>
          </button>

          <button
            id="tab-share-users"
            style={{
              flex: 1,
              padding: '0.85rem',
              background: 'none',
              border: 'none',
              color: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'users' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
            onClick={() => setActiveTab('users')}
          >
            <UserPlus size={16} />
            <span>Authorized Users ({currentFile.sharedWith?.length || 0})</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {message && (
            <div className="alert-success" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem' }}>
              <Check size={16} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: SECURE LINK */}
          {activeTab === 'link' && (
            <div>
              {hasExistingLink ? (
                <div>
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                    boxShadow: 'var(--shadow-card)',
                  }}>
                    <label className="form-label" style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                      Active Sharing Link
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                      <input
                        id="active-share-link-input"
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="form-input"
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        id="copy-share-link-btn"
                        className="btn btn-primary"
                        style={{ padding: '0.65rem 1.15rem', whiteSpace: 'nowrap' }}
                        onClick={() => copyToClipboard()}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>

                    {/* Metadata details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.75rem',
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PIN Passkey:</span><br />
                        <strong style={{ color: currentFile.shareLink?.isProtected ? 'var(--emerald-primary)' : 'var(--text-muted)', fontSize: '1rem', fontWeight: 700 }}>
                          {currentFile.shareLink?.isProtected ? currentFile.shareLink.pin : 'None (Public)'}
                        </strong>
                      </div>
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Downloads:</span><br />
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700 }}>
                          {currentFile.shareLink?.downloadsCount || 0} / {currentFile.shareLink?.maxDownloads > 0 ? currentFile.shareLink.maxDownloads : 'Unlimited'}
                        </strong>
                      </div>
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Expires:</span><br />
                        <strong style={{ color: 'var(--purple-primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                          {formatExpiryDisplay(currentFile.shareLink?.expiresAt)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <button
                    id="revoke-link-btn"
                    className="btn btn-danger"
                    style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
                    onClick={handleRevokeLink}
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                    <span>Revoke & Destroy Sharing Link</span>
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Generate an encrypted, cryptographically unique link to share this file with anyone over the internet.
                  </p>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={isProtected}
                        onChange={(e) => setIsProtected(e.target.checked)}
                      />
                      <KeyRound size={16} color="var(--cyan-primary)" />
                      <span>Protect with 6-Digit Security PIN</span>
                    </label>

                    {isProtected && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="e.g. 849201"
                          maxLength={8}
                          className="form-input"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setPin(Math.floor(100000 + Math.random() * 900000).toString())}
                          style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                        >
                          Generate PIN
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="share-modal-grid">
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> Expiration Time
                      </label>
                      <CustomSelect
                        id="expiry-select"
                        value={expiryPreset}
                        onChange={(e) => setExpiryPreset(e.target.value)}
                        options={expiryOptions}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <DownloadCloud size={14} /> Max Downloads
                      </label>
                      <CustomSelect
                        id="max-downloads-select"
                        value={maxDownloads}
                        onChange={(e) => setMaxDownloads(e.target.value)}
                        options={maxDownloadOptions}
                      />
                    </div>
                  </div>

                  {/* Custom Expiration Input */}
                  {expiryPreset === 'custom' && (
                    <div style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 0.9rem',
                      background: 'var(--bg-tertiary, rgba(255,255,255,0.03))',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                        Enter Custom Duration:
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          id="custom-expiry-value"
                          type="number"
                          className="form-input"
                          style={{ width: '90px' }}
                          min="1"
                          max="99999"
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                          placeholder="10"
                        />
                        <CustomSelect
                          id="custom-expiry-unit"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          options={customUnitOptions}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.4rem' }}>
                        ⏱️ Link will expire in {customValue || 1} {customUnit}.
                      </div>
                    </div>
                  )}

                  <button
                    id="create-share-link-btn"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
                    onClick={handleGenerateLink}
                    disabled={loading}
                  >
                    <Link2 size={16} />
                    <span>Generate Secure Link</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER ACCESS */}
          {activeTab === 'users' && (
            <div>
              <form onSubmit={handleShareWithUser} style={{ marginBottom: '1.25rem' }}>
                <div className="share-users-form-row">
                  <input
                    type="email"
                    required
                    placeholder="Recipient's registered email"
                    className="form-input"
                    style={{ flex: 1, minWidth: '180px' }}
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                  <CustomSelect
                    id="user-permission-select"
                    value={userPermission}
                    onChange={(e) => setUserPermission(e.target.value)}
                    options={permissionOptions}
                    style={{ width: '130px' }}
                  />
                  <button type="submit" className="btn btn-cyber" disabled={loading}>
                    <UserPlus size={16} />
                  </button>
                </div>
              </form>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Currently Authorized Users:
              </div>

              {currentFile.sharedWith && currentFile.sharedWith.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentFile.sharedWith.map((share, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(10, 17, 32, 0.8)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{share.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Permission: <span style={{ color: share.permission === 'download' ? '#34d399' : '#38bdf8' }}>
                            {share.permission.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-icon"
                        style={{ color: '#fb7185' }}
                        title="Revoke access"
                        onClick={() => handleRemoveUser(share.email)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No individual users granted access yet.
                </div>
              )}
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
