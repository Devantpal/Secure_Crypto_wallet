import React, { useState } from 'react'
import { validateMnemonic, keypairFromMnemonic, saveWallet, saveSession } from '../utils/wallet.js'

/**
 * ImportWallet
 * Restores a wallet from an existing 12-word mnemonic phrase.
 */
export default function ImportWallet({ onBack, onWalletCreated }) {
  const [mnemonic,   setMnemonic]   = useState('')
  const [password,   setPassword]   = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  // Count valid-looking words for live feedback
  const wordCount = mnemonic.trim().split(/\s+/).filter(Boolean).length

  const handleImport = async () => {
    setError('')

    // Validate mnemonic
    if (!validateMnemonic(mnemonic)) {
      setError('Invalid seed phrase. Please check your 12 words and try again.')
      return
    }

    // Validate password
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
      const keypair   = await keypairFromMnemonic(mnemonic)
      const publicKey = saveWallet(mnemonic.trim().toLowerCase(), keypair, password)
      saveSession(publicKey)
      onWalletCreated(publicKey)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h2 style={styles.title}>Import Wallet</h2>
        <p style={styles.subtitle}>
          Enter your 12-word seed phrase to restore your wallet.
        </p>
      </div>

      {/* Mnemonic input */}
      <div className="input-group">
        <label className="input-label">
          Seed Phrase
          <span style={styles.wordCountBadge(wordCount)}>
            {wordCount}/12 words
          </span>
        </label>
        <textarea
          className="input-field input-mono"
          placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
          value={mnemonic}
          onChange={e => setMnemonic(e.target.value)}
          rows={4}
          style={styles.textarea}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Word chips for visual feedback */}
      {mnemonic.trim() && (
        <div style={styles.wordChips}>
          {mnemonic.trim().split(/\s+/).filter(Boolean).map((word, i) => (
            <span key={i} style={styles.chip}>
              <span style={styles.chipNum}>{i + 1}</span>
              {word}
            </span>
          ))}
        </div>
      )}

      <div className="divider" />

      {/* New password for this device */}
      <p style={styles.sectionNote}>
        Set a password to encrypt this wallet on your device.
      </p>

      <div className="input-group">
        <label className="input-label">New Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="At least 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Confirm Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="Repeat your password"
          value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleImport()}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button
        className="btn btn-purple"
        onClick={handleImport}
        disabled={loading || wordCount !== 12}
      >
        {loading ? <><span className="spinner" /> Importing...</> : 'Import Wallet'}
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
  wordCountBadge: (count) => ({
    marginLeft: 8,
    padding: '2px 8px',
    borderRadius: 100,
    fontSize: 10,
    fontWeight: 700,
    background: count === 12 ? 'rgba(20,241,149,0.12)' : 'rgba(255,184,0,0.12)',
    color: count === 12 ? 'var(--accent-green)' : 'var(--warning)',
    border: `1px solid ${count === 12 ? 'rgba(20,241,149,0.2)' : 'rgba(255,184,0,0.2)'}`,
    fontFamily: 'var(--font-mono)',
  }),
  textarea: {
    resize: 'none',
    lineHeight: 1.7,
    fontSize: 13,
  },
  wordChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: -8,
    marginBottom: 12,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 100,
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  chipNum: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  sectionNote: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginBottom: 14,
  },
}
