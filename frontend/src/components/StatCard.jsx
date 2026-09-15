import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'cyan' }) {
  const colorMap = {
    cyan: {
      bg: 'rgba(0, 242, 254, 0.1)',
      border: 'rgba(0, 242, 254, 0.25)',
      text: 'var(--cyan-primary)',
      glow: 'rgba(0, 242, 254, 0.2)',
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
      text: 'var(--emerald-primary)',
      glow: 'rgba(16, 185, 129, 0.2)',
    },
    purple: {
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.25)',
      text: 'var(--purple-primary)',
      glow: 'rgba(139, 92, 246, 0.2)',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
      text: 'var(--amber-primary)',
      glow: 'rgba(245, 158, 11, 0.2)',
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.1)',
      border: 'rgba(244, 63, 94, 0.25)',
      text: 'var(--rose-primary)',
      glow: 'rgba(244, 63, 94, 0.2)',
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.4rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{
        width: '46px',
        height: '46px',
        borderRadius: '12px',
        background: scheme.bg,
        border: `1px solid ${scheme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: scheme.text,
        boxShadow: `0 0 15px ${scheme.glow}`,
      }}>
        <Icon size={22} />
      </div>
    </div>
  );
}
