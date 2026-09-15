import React, { useState } from 'react';
import { Sparkles, Upload, Sun, Moon, Palette, Check, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ openUploadModal, openAiModal, pageTitle, onToggleMobileNav }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeOptions = [
    { id: 'dark', label: 'Royal Indigo (Dark)', icon: Moon, desc: 'Deep sleek slate & violet' },
    { id: 'emerald', label: 'Mint Cyber (Matrix)', icon: Palette, desc: 'Obsidian & mint green' },
    { id: 'light', label: 'Clean Crisp (Light)', icon: Sun, desc: 'Crisp white & indigo' },
  ];

  return (
    <header className="app-navbar">
      {/* Left: Mobile Toggle + Page Title & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        <button
          id="mobile-menu-toggle-btn"
          className="mobile-menu-btn"
          onClick={onToggleMobileNav}
          title="Open Navigation"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <h2 className="navbar-title">
            {pageTitle}
          </h2>
          <div className="navbar-vault-badge">
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block',
              flexShrink: 0,
            }}></span>
            <span className="vault-badge-text-full">AES-256 Vault Active</span>
            <span className="vault-badge-text-mobile">Active</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Theme Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            id="theme-toggle-btn"
            className="btn btn-secondary navbar-action-btn"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title="Change Theme & Appearance"
          >
            {theme === 'light' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="var(--accent-primary)" />}
            <span className="nav-btn-text">Theme</span>
          </button>

          {showThemeMenu && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '230px',
                background: 'var(--bg-modal)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                padding: '0.5rem',
                zIndex: 200,
                animation: 'fadeIn 0.15s ease-out',
              }}
              onMouseLeave={() => setShowThemeMenu(false)}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.4rem 0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Select Color Theme
              </div>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id);
                      setShowThemeMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.85rem',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={15} />
                      <div>
                        <div>{opt.label}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-primary)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          id="navbar-ai-advisor-btn"
          onClick={openAiModal}
          className="btn btn-secondary navbar-action-btn"
          title="AI Security Advisor"
        >
          <Sparkles size={16} color="var(--purple-primary)" />
          <span className="nav-btn-text">AI Assistant</span>
        </button>

        <button
          id="navbar-upload-btn"
          onClick={openUploadModal}
          className="btn btn-primary navbar-action-btn"
          title="Upload & Encrypt File"
        >
          <Upload size={16} />
          <span className="nav-btn-text">Upload</span>
        </button>
      </div>
    </header>
  );
}
