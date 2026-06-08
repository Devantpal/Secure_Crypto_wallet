import React, { useState, useEffect } from 'react'
import WelcomePage  from './components/WelcomePage.jsx'
import CreateWallet from './components/CreateWallet.jsx'
import ImportWallet from './components/ImportWallet.jsx'
import Dashboard    from './components/Dashboard.jsx'
import { walletExists, getSession, saveSession, loadWallet, clearSession } from './utils/wallet.js'

/**
 * App.jsx — Main Router
 *
 * Pages / States:
 *   'welcome'    → WelcomePage  (no wallet exists)
 *   'create'     → CreateWallet
 *   'import'     → ImportWallet
 *   'unlock'     → UnlockScreen (wallet exists, not logged in)
 *   'dashboard'  → Dashboard    (logged in)
 */
export default function App() {
  const [page,      setPage]      = useState('loading')
  const [publicKey, setPublicKey] = useState(null)

  // ── Determine starting page on mount ──────
  useEffect(() => {
    const session = getSession()

    if (session) {
      // Active session → go straight to dashboard
      setPublicKey(session)
      setPage('dashboard')
    } else if (walletExists()) {
      // Wallet on disk but no session → unlock screen
      setPage('unlock')
    } else {
      // Fresh install → welcome
      setPage('welcome')
    }
  }, [])

  // ── Callback: wallet created / imported ───
  const handleWalletCreated = (pubkey) => {
    setPublicKey(pubkey)
    setPage('dashboard')
  }

  // ── Callback: logout ───────────────────────
  const handleLogout = () => {
    clearSession()
    setPublicKey(null)
    if (walletExists()) {
      setPage('unlock')
    } else {
      setPage('welcome')
    }
  }

  // ── Render ─────────────────────────────────
  if (page === 'loading') {
    return (
      <div className="app-shell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}>
          <span className="spinner" style={{ borderTopColor: 'var(--accent-green)', width: 28, height: 28, borderWidth: 3 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="wallet-container">

        {page === 'welcome' && (
          <WelcomePage
            onCreateWallet={() => setPage('create')}
            onImportWallet={() => setPage('import')}
          />
        )}

        {page === 'create' && (
          <CreateWallet
            onBack={() => setPage('welcome')}
            onWalletCreated={handleWalletCreated}
          />
        )}

        {page === 'import' && (
          <ImportWallet
            onBack={() => setPage('welcome')}
            onWalletCreated={handleWalletCreated}
          />
        )}

        {page === 'unlock' && (
          <UnlockScreen
            onUnlocked={handleWalletCreated}
            onDeleteWallet={() => setPage('welcome')}
          />
        )}

        {page === 'dashboard' && (
          <Dashboard
            publicKey={publicKey}
            onLogout={handleLogout}
          />
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// UnlockScreen — shown when wallet exists but no active session
// ─────────────────────────────────────────────
function UnlockScreen({ onUnlocked, onDeleteWallet }) {
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Small artificial delay so it doesn't feel instant (UX)
      await new Promise(r => setTimeout(r, 200))
      const walletData = loadWallet(password)
      if (!walletData) throw new Error('Wallet not found.')
      saveSession(walletData.publicKey)
      onUnlocked(walletData.publicKey)
    } catch (err) {
      setError('Incorrect password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={unlockStyles.container}>
      {/* Logo */}
      <div style={unlockStyles.logo}>
        <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="12" fill="url(#unlockGrad)" />
          <path d="M10 26 L20 10 L30 26" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M13 22 L27 22" stroke="black" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="unlockGrad" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#14F195" />
              <stop offset="100%" stopColor="#9945FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h2 style={unlockStyles.title}>Welcome Back</h2>
      <p style={unlockStyles.subtitle}>Enter your password to unlock CryptoVault</p>

      <div className="input-group" style={{ width: '100%' }}>
        <label className="input-label">Wallet Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          autoFocus
        />
      </div>

      {error && <div className="alert alert-error" style={{ width: '100%' }}>{error}</div>}

      <button
        className="btn btn-primary"
        onClick={handleUnlock}
        disabled={loading}
        style={{ width: '100%' }}
      >
        {loading ? <><span className="spinner" /> Unlocking...</> : '🔓 Unlock Wallet'}
      </button>

      <button
        style={unlockStyles.forgotBtn}
        onClick={() => {
          if (window.confirm('This will delete your wallet from this device.\nMake sure you have your seed phrase!')) {
            const { deleteWallet } = require('./utils/wallet.js')
            deleteWallet()
            onDeleteWallet()
          }
        }}
      >
        Forgot password? (Restore from seed phrase)
      </button>
    </div>
  )
}

const unlockStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px 32px',
    gap: 12,
    flex: 1,
  },
  logo: {
    marginBottom: 8,
    filter: 'drop-shadow(0 0 20px rgba(20,241,149,0.3))',
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 20,
    textAlign: 'center',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'var(--font-ui)',
    marginTop: 8,
  },
}
