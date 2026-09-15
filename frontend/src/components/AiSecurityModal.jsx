import React, { useState } from 'react';
import { X, Bot, Send, Sparkles, Shield, Lock, FileQuestion } from 'lucide-react';
import { api } from '../services/api';

export default function AiSecurityModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your **AI Cybersecurity & Privacy Advisor**. 

I can assist you with:
- Explaining **AES-256-GCM** encryption and initialization vectors.
- Recommending data classification and sharing protection policies.
- Compliance standards (GDPR, HIPAA, ISO 27001) for file storage.
- Best practices for link expiry, PIN protection, and download limit configurations.

How can I assist your security review today?`,
      provider: 'SecureVault AI Security Advisor',
    }
  ]);
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'How does AES-256-GCM protect my files?',
    'Best practices for sharing confidential contracts',
    'Explain download audit trail & compliance',
    'How to protect sharing links with PIN and expiry?',
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', text: query }];
    setMessages(newMessages);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.askAi(query, { timestamp: new Date().toISOString() });
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: res.reply,
          provider: res.provider,
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: `⚠️ Security query error: ${err.message}. Please try again.`,
          provider: 'System',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '720px', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(124, 58, 237, 0.12)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--purple-primary)',
            }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                AI Security Advisor <span style={{ fontSize: '0.7rem', color: 'var(--purple-primary)', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.25)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>Gemini Intelligence</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Intelligent security guidance, compliance analysis & cryptographic insights
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Chat History */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '0.9rem 1.15rem',
                borderRadius: '14px',
                background: m.role === 'user'
                  ? 'var(--brand-gradient)'
                  : 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                fontWeight: m.role === 'user' ? 600 : 400,
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow-card)',
              }}>
                {m.text}
              </div>

              {m.provider && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.3rem', padding: '0 0.5rem' }}>
                  {m.provider}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cyan-primary)', fontSize: '0.85rem' }}>
              <Sparkles size={16} className="shield-pulse" />
              <span>Analyzing cybersecurity parameters...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div style={{
          padding: '0.65rem 1.25rem',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              disabled={loading}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '999px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--bg-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          gap: '0.75rem',
        }}>
          <input
            type="text"
            placeholder="Ask AI about encryption, sensitive files, or access control..."
            className="form-input"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={loading}
          />
          <button
            id="ai-send-btn"
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={loading || !inputPrompt.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
