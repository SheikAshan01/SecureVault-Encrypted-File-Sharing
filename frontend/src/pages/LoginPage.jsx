import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
    }}>
      <div className="glass-card auth-card">
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)',
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.3)',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Secure<span className="text-gradient">Vault</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Enterprise Encrypted File Sharing System
          </p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email-input"
                type="email"
                required
                className="form-input"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password-input"
                type="password"
                required
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Secure Vault'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instant Demo Sign-In
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              id="demo-admin-login-btn"
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
              onClick={() => handleQuickLogin('admin@secure.io', 'Admin@12345')}
            >
              👑 Admin Demo
            </button>
            <button
              id="demo-user-login-btn"
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
              onClick={() => handleQuickLogin('alex@company.com', 'User@12345')}
            >
              👤 User Demo
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button
            id="switch-to-register-btn"
            type="button"
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--cyan-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}
