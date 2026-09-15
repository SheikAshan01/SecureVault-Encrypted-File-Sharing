import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Lock, 
  KeyRound, 
  Clock, 
  AlertTriangle, 
  FileCode, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import { api } from '../services/api';

export default function PublicDownloadPage({ token, onGoHome }) {
  const [fileInfo, setFileInfo] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      try {
        setLoading(true);
        setError('');
        const data = await api.getPublicInfo(token);
        setFileInfo(data);
      } catch (err) {
        setError(err.message || 'Invalid or expired secure link.');
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      loadInfo();
    }
  }, [token]);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (fileInfo?.isProtected && !pin) {
      setError('Please enter the 6-digit security PIN to unlock this file.');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const blob = await api.downloadPublicFile(token, pin);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Decryption failed. Please verify your PIN.');
    } finally {
      setDownloading(false);
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--body-bg-gradient)',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <div className="glass-card auth-card" style={{ maxWidth: '520px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
            border: '1px solid var(--border-color)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            boxShadow: '0 0 25px var(--accent-glow)',
            marginBottom: '0.75rem',
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Secure File <span className="text-gradient">Transfer Portal</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Encrypted with AES-256-GCM. Authorized recipients only.
          </p>
        </div>

        {/* State Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            Verifying cryptographic token security...
          </div>
        ) : error && !fileInfo ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div className="alert-error" style={{ justifyContent: 'center', marginBottom: '1.5rem', padding: '1rem', fontSize: '0.9rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
            <button className="btn btn-secondary" onClick={onGoHome}>
              <ArrowLeft size={16} />
              <span>Return to Home</span>
            </button>
          </div>
        ) : fileInfo && (
          <div>
            {error && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* File Info Box */}
            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-primary)',
                }}>
                  <FileCode size={24} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {fileInfo.originalName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Size: {formatBytes(fileInfo.sizeBytes)}
                  </div>
                </div>
              </div>

              {/* Badges / Security specs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <span className="badge badge-aes">
                  <Lock size={10} /> AES-256-GCM
                </span>
                {fileInfo.isProtected && (
                  <span className="badge badge-warning">
                    <KeyRound size={10} /> PIN Required
                  </span>
                )}
                {fileInfo.expiresAt && (
                  <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={10} /> Expires: {new Date(fileInfo.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(fileInfo.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {fileInfo.maxDownloads > 0 && (
                  <span className="badge badge-success">
                    {fileInfo.maxDownloads - fileInfo.downloadsCount} Downloads Left
                  </span>
                )}
              </div>

              {/* SHA-256 preview */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span>Integrity Hash: </span>
                <span className="mono-hash">{fileInfo.sha256Checksum?.substring(0, 24)}...</span>
              </div>
            </div>

            {/* PIN Entry if required */}
            <form onSubmit={handleDownload}>
              {fileInfo.isProtected && (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <KeyRound size={14} color="var(--cyan-primary)" />
                    <span>Enter 6-Digit Security PIN</span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    className="form-input"
                    placeholder="Enter recipient PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.1rem', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}

              {success ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid var(--emerald-primary)',
                  color: '#34d399',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}>
                  <CheckCircle2 size={22} style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                  Decryption Successful! Your download has started.
                </div>
              ) : (
                <button
                  id="public-decrypt-download-btn"
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem' }}
                  disabled={downloading}
                >
                  <Download size={18} />
                  <span>{downloading ? 'Decrypting AES-256 Stream...' : 'Unlock & Decrypt File'}</span>
                </button>
              )}
            </form>

            {/* <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={onGoHome}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Sign In to Vault Account
              </button>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
}
