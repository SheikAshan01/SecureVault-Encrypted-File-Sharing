import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import FileUploadModal from './components/FileUploadModal';
import ShareModal from './components/ShareModal';
import DownloadHistoryModal from './components/DownloadHistoryModal';
import AiSecurityModal from './components/AiSecurityModal';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyFilesPage from './pages/MyFilesPage';
import SharedWithMePage from './pages/SharedWithMePage';
import AuditLogsPage from './pages/AuditLogsPage';
import AdminPage from './pages/AdminPage';
import PublicDownloadPage from './pages/PublicDownloadPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [historyFile, setHistoryFile] = useState(null);

  // Hash-based public download routing (#download/<token>)
  const [publicToken, setPublicToken] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#download/')) {
        const token = hash.replace('#download/', '');
        setPublicToken(token);
      } else {
        setPublicToken(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (publicToken) {
    return (
      <PublicDownloadPage
        token={publicToken}
        onGoHome={() => {
          window.location.hash = '';
          setPublicToken(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060a12',
        color: 'var(--cyan-primary)',
        fontFamily: 'var(--font-main)',
        fontSize: '1.1rem',
        fontWeight: 600,
        gap: '0.75rem',
      }}>
        <span className="shield-pulse">🔒 Initializing Secure Vault Subsystems...</span>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthMode('register')} />;
  }

  const pageTitles = {
    dashboard: 'Security Dashboard & Vault Overview',
    'my-files': 'Encrypted File Storage Ledger',
    'shared-with-me': 'Incoming Shared Files',
    'audit-logs': 'Download & Audit Trail Records',
    admin: 'System Security & Governance Console',
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAiModal={() => setIsAiOpen(true)}
        openUploadModal={() => setIsUploadOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="main-content">
        <Navbar
          pageTitle={pageTitles[currentTab] || 'SecureVault'}
          openUploadModal={() => setIsUploadOpen(true)}
          openAiModal={() => setIsAiOpen(true)}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />

        {currentTab === 'dashboard' && (
          <DashboardPage
            openUploadModal={() => setIsUploadOpen(true)}
            openAiModal={() => setIsAiOpen(true)}
            onShareFile={(file) => setShareFile(file)}
            onHistoryFile={(file) => setHistoryFile(file)}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'my-files' && (
          <MyFilesPage
            openUploadModal={() => setIsUploadOpen(true)}
            onShareFile={(file) => setShareFile(file)}
            onHistoryFile={(file) => setHistoryFile(file)}
          />
        )}

        {currentTab === 'shared-with-me' && <SharedWithMePage />}

        {currentTab === 'audit-logs' && <AuditLogsPage />}

        {currentTab === 'admin' && user.role === 'admin' && <AdminPage />}
      </div>

      {/* Global Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          // Trigger view update
          setCurrentTab('my-files');
        }}
      />

      <ShareModal
        isOpen={Boolean(shareFile)}
        file={shareFile}
        onClose={() => setShareFile(null)}
        onUpdated={(updatedFile) => {
          setShareFile(updatedFile);
        }}
      />

      <DownloadHistoryModal
        isOpen={Boolean(historyFile)}
        file={historyFile}
        onClose={() => setHistoryFile(null)}
      />

      <AiSecurityModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
