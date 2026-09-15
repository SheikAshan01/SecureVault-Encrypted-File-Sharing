import React from 'react';
import { 
  ShieldCheck, 
  FolderLock, 
  Share2, 
  History, 
  ShieldAlert, 
  Bot, 
  LogOut, 
  User, 
  LayoutDashboard,
  Lock,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  openAiModal, 
  openUploadModal,
  isMobileOpen = false,
  onCloseMobile
}) {
  const { user, logout } = useAuth();

  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleUploadClick = () => {
    openUploadModal();
    if (onCloseMobile) onCloseMobile();
  };

  const handleAiClick = () => {
    openAiModal();
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-files', label: 'My Encrypted Vault', icon: FolderLock },
    { id: 'shared-with-me', label: 'Shared With Me', icon: Share2 },
    { id: 'audit-logs', label: 'Download & Audit Logs', icon: History },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Security Center', icon: ShieldAlert });
  }

  return (
    <>
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-label="Close navigation overlay"
        />
      )}
      <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0,
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                Secure<span className="text-gradient">Vault</span>
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                AES-256-GCM Security
              </div>
            </div>
          </div>

          <button
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            title="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Action Button */}
        <div style={{ padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
          <button
            id="sidebar-upload-btn"
            onClick={handleUploadClick}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem 1rem' }}
          >
            <Lock size={18} />
            <span>Upload & Encrypt</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
          }}>
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--btn-primary-bg)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* AI Advisor Button */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              id="sidebar-ai-advisor-btn"
              onClick={handleAiClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.28)',
                color: 'var(--purple-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.18)';
                e.currentTarget.style.borderColor = 'var(--purple-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.28)';
              }}
            >
              <Bot size={19} />
              <span>AI Security Advisor</span>
            </button>
          </div>
        </nav>

      {/* User Footer Profile */}
      <div style={{
        padding: '1.25rem',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: user?.role === 'admin' 
                ? 'linear-gradient(135deg, #f59e0b, #ef4444)' 
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              flexShrink: 0,
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'var(--text-primary)',
              }}>
                {user?.name || 'User'}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.15rem' }}>
                <span className={user?.role === 'admin' ? 'badge badge-warning' : 'badge badge-aes'}>
                  {user?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="btn-icon"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
