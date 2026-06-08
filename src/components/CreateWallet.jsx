import React, { useState, useEffect } from 'react'
import { generateMnemonic, keypairFromMnemonic, saveWallet, saveSession } from '../utils/wallet.js'

/**
 * CreateWallet
 *
 * Flow:
 *  Step 1 — Show generated mnemonic, user must confirm they backed it up
 *  Step 2 — Set wallet password
 *  Step 3 — Saving... then redirect to Dashboard
 */
export default function CreateWallet({ onBack, onWalletCreated }) {
  const [step, setStep]           = useState(1)  // 1: mnemonic | 2: password
  const [mnemonic, setMnemonic]   = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [revealed, setRevealed]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)

  // Generate mnemonic once on mount
  useEffect(() => {
    setMnemonic(generateMnemonic())
  }, [])

  const words = mnemonic.split(' ')

  // ── Copy mnemonic to clipboard ──
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy. Please select and copy manually.')
    }
  }

  // ── Proceed to password step ──
  const handleNextStep = () => {
    if (!confirmed) {
      setError('Please confirm you have backed up your seed phrase.')
      return
    }
    setError('')
    setStep(2)
  }

  // ── Create wallet with password ──
  const handleCreateWallet = async () => {
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      // Derive Solana keypair from mnemonic
      const keypair   = await keypairFromMnemonic(mnemonic)
      const publicKey = saveWallet(mnemonic, keypair, password)

      // Save session (public key only)
      saveSession(publicKey)

      onWalletCreated(publicKey)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ────────────────────────────────────────────
  // STEP 1: Show Seed Phrase
  // ────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="fade-in" style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>
            ← Back
          </button>
          <h2 style={styles.title}>Your Seed Phrase</h2>
          <p style={styles.subtitle}>
            Write down these 12 words in order and store them somewhere safe.
            Anyone with these words can access your wallet.
          </p>
        </div>

        {/* Warning banner */}
        <div className="alert alert-error" style={{ fontSize: 12 }}>
          ⚠️ Never share your seed phrase. CryptoVault will never ask for it.
        </div>

        {/* Mnemonic Grid */}
        <div style={styles.mnemonicWrapper}>
          {/* Blur overlay until user clicks reveal */}
          {!revealed && (
            <div style={styles.blurOverlay} onClick={() => setRevealed(true)}>
              <span style={styles.revealHint}>👁 Click to reveal seed phrase</span>
            </div>
          )}
          <div style={{ ...styles.mnemonicGrid, filter: revealed ? 'none' : 'blur(8px)' }}>
            {words.map((word, i) => (
              <div key={i} style={styles.wordItem}>
                <span style={styles.wordIndex}>{i + 1}</span>
                <span style={styles.word}>{word}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy button */}
        {revealed && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            style={{ marginBottom: 16, alignSelf: 'flex-start' }}
          >
            {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
          </button>
        )}

        {/* Confirmation checkbox */}
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.checkText}>
            I have written down my seed phrase and stored it safely.
          </span>
        </label>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleNextStep}
          style={{ marginTop: 8 }}
        >
          Continue →
        </button>
      </div>
    )
  }

  // ────────────────────────────────────────────
  // STEP 2: Set Password
  // ────────────────────────────────────────────
  return (
    <div className="fade-in" style={styles.container}>

      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => setStep(1)}>
          ← Back
        </button>
        <h2 style={styles.title}>Set Wallet Password</h2>
        <p style={styles.subtitle}>
          This password encrypts your wallet locally.
          You'll need it to sign transactions and view your seed phrase.
        </p>
      </div>

      <div className="input-group">
        <label className="input-label">Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="At least 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && document.getElementById('confirm-pw').focus()}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Confirm Password</label>
        <input
          id="confirm-pw"
          type="password"
          className="input-field"
          placeholder="Repeat your password"
          value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreateWallet()}
        />
      </div>

      {/* Password strength indicator */}
      <div style={styles.strengthBar}>
        <div style={{
          ...styles.strengthFill,
          width: `${Math.min(100, (password.length / 16) * 100)}%`,
          background: password.length < 8 ? '#FF4D4D'
                     : password.length < 12 ? '#FFB800'
                     : '#14F195',
        }} />
      </div>
      <p style={styles.strengthLabel}>
        {password.length === 0 ? '' :
         password.length < 8  ? 'Weak' :
         password.length < 12 ? 'Good' : 'Strong'}
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <button
        className="btn btn-primary"
        onClick={handleCreateWallet}
        disabled={loading}
        style={{ marginTop: 8 }}
      >
        {loading ? <><span className="spinner" /> Creating Wallet...</> : 'Create Wallet'}
      </button>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    flex: 1,
    overflowY: 'auto',
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 12,
    fontFamily: 'var(--font-ui)',
    transition: 'color 0.2s',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  mnemonicWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  blurOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    borderRadius: 'var(--radius-md)',
    background: 'rgba(17,17,17,0.5)',
  },
  revealHint: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    padding: '8px 16px',
    borderRadius: 100,
  },
  mnemonicGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    padding: 4,
    transition: 'filter 0.3s',
  },
  wordItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 10px',
  },
  wordIndex: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    minWidth: 14,
    fontWeight: 600,
  },
  word: {
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 2,
    accentColor: 'var(--accent-green)',
    width: 15,
    height: 15,
    flexShrink: 0,
  },
  checkText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  strengthBar: {
    height: 3,
    background: 'var(--border)',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  strengthLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 16,
  },
}
