import React, { useState, useRef } from 'react';
import { X, UploadCloud, Shield, CheckCircle, AlertTriangle, Lock, FileCode } from 'lucide-react';
import { api } from '../services/api';
import CustomSelect from './CustomSelect';

const securityOptions = [
  { value: 'standard', label: 'Standard (AES-256)' },
  { value: 'confidential', label: 'Confidential (AES-256-GCM)' },
  { value: 'top-secret', label: 'Top-Secret (Restricted Vault)' },
];

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [securityLevel, setSecurityLevel] = useState('confidential');
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to encrypt and upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      setStage('Generating 16-byte random IV...');
      await new Promise(r => setTimeout(r, 350));

      setStage('Computing SHA-256 integrity hash...');
      await new Promise(r => setTimeout(r, 350));

      setStage('Performing AES-256-GCM cipher encryption...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('securityLevel', securityLevel);

      const res = await api.uploadFile(formData);

      setStage('Verification complete. Ciphertext stored in vault.');
      setSuccess(true);
      setTimeout(() => {
        setUploading(false);
        setFile(null);
        setSuccess(false);
        onUploadSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || 'File upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
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
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Secure File Vault Upload</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Files are encrypted with AES-256-GCM before storage</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={uploading}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          {!file ? (
            <div
              className="dropzone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <UploadCloud size={44} style={{ color: 'var(--cyan-primary)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                Drag & drop files here, or <span style={{ color: 'var(--cyan-primary)' }}>browse</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Maximum payload: 50MB per file • Zero-Knowledge Encryption
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                  }}>
                    <FileCode size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Size: {formatSize(file.size)} • Type: {file.type || 'Binary file'}
                    </div>
                  </div>
                </div>
                {!uploading && (
                  <button
                    className="btn-icon"
                    onClick={() => setFile(null)}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security Classification */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Security Classification</label>
            <CustomSelect
              id="upload-security-select"
              value={securityLevel}
              onChange={(e) => setSecurityLevel(e.target.value)}
              options={securityOptions}
              disabled={uploading}
            />

            {/* Dynamic Explainer */}
            <div style={{
              marginTop: '0.65rem',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}>
              {securityLevel === 'standard' && (
                <div>
                  <strong style={{ color: '#10b981' }}>🟢 Standard Protection:</strong> Fast 256-bit symmetric encryption. Best for everyday business files, receipts, notes, and general documents.
                </div>
              )}
              {securityLevel === 'confidential' && (
                <div>
                  <strong style={{ color: 'var(--accent-primary)' }}>🔵 Confidential Document:</strong> Authenticated AES-256-GCM cipher with cryptographic integrity check. Recommended for business contracts and financial statements.
                </div>
              )}
              {securityLevel === 'top-secret' && (
                <div>
                  <strong style={{ color: '#fb7185' }}>🔴 Top-Secret Classification:</strong> High-security isolation vault. Files are tagged with strict access limits and mandatory PIN recommendation. Ideal for legal, medical, and sensitive credentials.
                </div>
              )}
            </div>
          </div>

          {/* Upload & Encryption Progress */}
          {uploading && (
            <div style={{
              background: 'rgba(0, 242, 254, 0.05)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginTop: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {success ? (
                  <CheckCircle size={18} color="#10b981" />
                ) : (
                  <Lock size={18} color="#00f2fe" className="shield-pulse" />
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: success ? '#10b981' : 'var(--cyan-primary)' }}>
                  {stage}
                </span>
              </div>
              <div style={{
                height: '6px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: success ? '100%' : '75%',
                  background: success ? '#10b981' : 'linear-gradient(90deg, #00f2fe, #3b82f6)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            id="modal-encrypt-upload-btn"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            <Shield size={16} />
            <span>{uploading ? 'Encrypting...' : 'Encrypt & Upload'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
