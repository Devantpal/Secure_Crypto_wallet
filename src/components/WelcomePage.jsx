import React from 'react'

/**
 * WelcomePage
 * First screen the user sees.
 * Offers: Create new wallet | Import existing wallet
 */
export default function WelcomePage({ onCreateWallet, onImportWallet }) {
  return (
    <div className="fade-in" style={styles.container}>

      {/* ── Logo / Branding ── */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="url(#logoGrad)" />
            <path
              d="M10 26 L20 10 L30 26"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M13 22 L27 22"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#14F195" />
                <stop offset="100%" stopColor="#9945FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={styles.appName}>CryptoVault</h1>
        <p style={styles.tagline}>Decentralized · Secure · Yours</p>

        {/* Network badge */}
        <div style={styles.networkBadge}>
          <span style={styles.networkDot} />
          Solana Devnet
        </div>
      </div>

      {/* ── Illustration / Art ── */}
      <div style={styles.artSection}>
        <svg width="200" height="120" viewBox="0 0 200 120" fill="none" opacity="0.6">
          {/* Grid lines */}
          {[20,40,60,80,100,120,140,160,180].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#222" strokeWidth="1" />
          ))}
          {[20,40,60,80,100].map(y => (
            <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#222" strokeWidth="1" />
          ))}
          {/* Blockchain nodes */}
          {[
            [40, 60, '#14F195'],
            [100, 40, '#9945FF'],
            [160, 70, '#14F195'],
            [130, 95, '#00C2FF'],
            [70, 90, '#9945FF'],
          ].map(([cx, cy, color], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="3" fill={color} />
            </g>
          ))}
          {/* Connecting lines */}
          <line x1="40" y1="60" x2="100" y2="40" stroke="#14F195" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="100" y1="40" x2="160" y2="70" stroke="#9945FF" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="40" y1="60" x2="70" y2="90" stroke="#9945FF" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="70" y1="90" x2="130" y2="95" stroke="#00C2FF" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="130" y1="95" x2="160" y2="70" stroke="#14F195" strokeWidth="1" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* ── Feature Bullets ── */}
      <div style={styles.features}>
        {[
          { icon: '🔐', text: 'Self-custody — you own your keys' },
          { icon: '⚡', text: 'Solana — fast & low-fee transactions' },
          { icon: '☁️',  text: 'Cloud backup coming in Phase 4' },
        ].map(({ icon, text }) => (
          <div key={text} style={styles.featureRow}>
            <span style={styles.featureIcon}>{icon}</span>
            <span style={styles.featureText}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      <div style={styles.actions}>
        <button
          className="btn btn-primary"
          onClick={onCreateWallet}
        >
          + Create New Wallet
        </button>

        <button
          className="btn btn-secondary"
          onClick={onImportWallet}
          style={{ marginTop: 10 }}
        >
          Import Existing Wallet
        </button>
      </div>

      {/* ── Footer ── */}
      <p style={styles.footer}>
        Phase 1 · Local MVP · Solana Devnet
      </p>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 24px 24px',
    height: '100%',
    flex: 1,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoIcon: {
    marginBottom: 4,
    filter: 'drop-shadow(0 0 16px rgba(20,241,149,0.3))',
  },
  appName: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    letterSpacing: '0.06em',
    fontWeight: 500,
  },
  networkBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    padding: '4px 12px',
    background: 'rgba(20,241,149,0.08)',
    border: '1px solid rgba(20,241,149,0.15)',
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--accent-green)',
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent-green)',
    boxShadow: '0 0 6px var(--accent-green)',
    display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite',
  },
  artSection: {
    marginBottom: 20,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginBottom: 28,
  },
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
  },
  featureIcon: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  actions: {
    width: '100%',
  },
  footer: {
    marginTop: 20,
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.04em',
  },
}
