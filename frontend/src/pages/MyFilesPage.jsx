import React, { useState, useEffect } from 'react';
import { FolderLock, Search, Filter, UploadCloud, RefreshCw } from 'lucide-react';
import FileCard from '../components/FileCard';
import CustomSelect from '../components/CustomSelect';
import { api } from '../services/api';

const classificationOptions = [
  { value: 'all', label: 'All Classifications' },
  { value: 'standard', label: 'Standard (AES-256)' },
  { value: 'confidential', label: 'Confidential (GCM)' },
  { value: 'top-secret', label: 'Top-Secret' },
];

export default function MyFilesPage({ openUploadModal, onShareFile, onHistoryFile }) {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.getMyFiles();
      setFiles(res.files || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
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
      fetchFiles();
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (file) => {
    if (confirm(`Permanently delete "${file.originalName}" from vault?`)) {
      try {
        await api.deleteFile(file._id || file.id);
        fetchFiles();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = classificationFilter === 'all' || f.securityLevel === classificationFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FolderLock size={26} color="var(--cyan-primary)" />
            <span>My Encrypted Vault</span>
          </h1>
          <p className="page-subtitle">
            All files are stored in hardware-encrypted binary blobs using AES-256-GCM.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchFiles} title="Refresh file list">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={openUploadModal}>
            <UploadCloud size={16} />
            <span>Upload & Encrypt</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '0.85rem 1.15rem' }}>
        <div className="search-filter-row">
          <div className="search-input-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search files by name..."
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '0.35rem 0', boxShadow: 'none', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-select-box">
            <Filter size={16} color="var(--text-muted)" />
            <CustomSelect
              id="classification-filter-select"
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              options={classificationOptions}
              style={{ minWidth: '170px' }}
            />
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Retrieving encrypted vault files...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="glass-card empty-state">
          <FolderLock size={44} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Files Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {searchTerm || classificationFilter !== 'all'
              ? 'Try adjusting your search criteria or filter.'
              : 'Upload your first sensitive document to begin protecting it.'}
          </p>
        </div>
      ) : (
        <div className="grid-files">
          {filteredFiles.map((file) => (
            <FileCard
              key={file._id || file.id}
              file={file}
              onDownload={handleDownload}
              onShare={onShareFile}
              onHistory={onHistoryFile}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
