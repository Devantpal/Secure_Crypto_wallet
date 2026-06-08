import React, { useState, useEffect, useCallback } from 'react'
import {
  getBalance,
  requestAirdrop,
  sendSOL,
  getTransactionHistory,
  shortenAddress,
  formatSOL,
  explorerUrl,
  isValidAddress,
  NETWORK,
} from '../utils/solana.js'
import { loadWallet, clearSession, deleteWallet } from '../utils/wallet.js'

/**
 * Dashboard
 * Main wallet interface showing:
 *  - Wallet address + balance
 *  - Send / Receive / Airdrop actions
 *  - Transaction history
 *  - Logout / Delete wallet
 */
export default function Dashboard({ publicKey, onLogout }) {
  // ── State ──────────────────────────────────
  const [balance,     setBalance]     = useState(null)
  const [txHistory,   setTxHistory]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  // Modal states
  const [activeModal, setActiveModal] = useState(null) // 'send' | 'receive' | 'unlock' | null

  // Send form
  const [sendTo,      setSendTo]      = useState('')
  const [sendAmount,  setSendAmount]  = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError,   setSendError]   = useState('')
  const [sendSuccess, setSendSuccess] = useState('')

  // Airdrop
  const [airdropLoading, setAirdropLoading] = useState(false)
  const [airdropMsg,     setAirdropMsg]     = useState('')

  // Unlock (for signing)
  const [unlockPw,    setUnlockPw]    = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  // Copy address
  const [copied, setCopied] = useState(false)

  // ── Data Fetching ──────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [bal, txs] = await Promise.all([
        getBalance(publicKey),
        getTransactionHistory(publicKey, 8),
      ])
      setBalance(bal)
      setTxHistory(txs)
    } catch (err) {
      setError('Failed to connect to Solana Devnet. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getBalance(publicKey).then(setBalance).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [publicKey])

  // ── Copy Address ───────────────────────────
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  // ── Airdrop ────────────────────────────────
  const handleAirdrop = async () => {
    if (airdropLoading) return
    setAirdropLoading(true)
    setAirdropMsg('')
    try {
      const sig = await requestAirdrop(publicKey, 1)
      setAirdropMsg(`✓ Airdropped 1 SOL! Tx: ${shortenAddress(sig, 6)}`)
      // Refresh balance
      const newBal = await getBalance(publicKey)
      setBalance(newBal)
      // Refresh history
      const txs = await getTransactionHistory(publicKey, 8)
      setTxHistory(txs)
    } catch (err) {
      setAirdropMsg('Airdrop failed. Try again in a few seconds.')
    } finally {
      setAirdropLoading(false)
    }
  }

  // ── Send SOL (requires password unlock) ───
  const handleSendInit = () => {
    setSendError('')
    setSendSuccess('')
    setSendTo('')
    setSendAmount('')
    setActiveModal('send')
  }

  const handleSendConfirm = () => {
    setSendError('')
    if (!isValidAddress(sendTo)) {
      setSendError('Invalid recipient address.')
      return
    }
    const amt = parseFloat(sendAmount)
    if (isNaN(amt) || amt <= 0) {
      setSendError('Enter a valid amount.')
      return
    }
    if (amt > balance) {
      setSendError('Insufficient balance.')
      return
    }
    // Show unlock modal to get password for signing
    setPendingAction('send')
    setUnlockPw('')
    setUnlockError('')
    setActiveModal('unlock')
  }

  const handleUnlockAndExecute = async () => {
    setUnlockError('')
    try {
      const walletData = loadWallet(unlockPw)
      if (!walletData) throw new Error('Wallet not found.')

      if (pendingAction === 'send') {
        setSendLoading(true)
        setActiveModal(null)
        try {
          const sig = await sendSOL(walletData, sendTo, parseFloat(sendAmount))
          setSendSuccess(`✓ Sent ${sendAmount} SOL! Signature: ${shortenAddress(sig, 8)}`)
          const newBal = await getBalance(publicKey)
          setBalance(newBal)
          const txs = await getTransactionHistory(publicKey, 8)
          setTxHistory(txs)
          setActiveModal('send') // Re-open send modal to show success
        } catch (err) {
          setSendError(err.message)
          setActiveModal('send')
        } finally {
          setSendLoading(false)
        }
      }
    } catch (err) {
      setUnlockError('Incorrect password.')
    }
  }

  // ── Logout ─────────────────────────────────
  const handleLogout = () => {
    clearSession()
    onLogout()
  }

  // ── Delete Wallet ──────────────────────────
  const handleDeleteWallet = () => {
    if (window.confirm('⚠️ Are you sure? This will permanently delete your wallet from this device. Make sure you have your seed phrase backed up!')) {
      deleteWallet()
      onLogout()
    }
  }

  // ────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.networkPill}>
            <span style={styles.networkDot} />
            {NETWORK}
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn} onClick={fetchData} title="Refresh">
            ↻
          </button>
          <button style={styles.iconBtn} onClick={handleLogout} title="Lock wallet">
            🔒
          </button>
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div style={styles.balanceCard}>
        {/* Address */}
        <div style={styles.addressRow}>
          <span style={styles.addressText}>{shortenAddress(publicKey, 6)}</span>
          <button style={styles.copyBtn} onClick={handleCopyAddress}>
            {copied ? '✓' : '⧉'}
          </button>
        </div>

        {/* Balance */}
        <div style={styles.balanceRow}>
          {loading ? (
            <span className="spinner" style={{ borderTopColor: 'var(--accent-green)', width: 24, height: 24 }} />
          ) : (
            <>
              <span style={styles.balanceAmount}>
                {balance !== null ? formatSOL(balance) : '—'}
              </span>
              <span style={styles.balanceCurrency}>SOL</span>
            </>
          )}
        </div>

        {/* USD estimate (placeholder) */}
        <p style={styles.balanceUsd}>≈ Devnet Tokens (no real value)</p>

        {error && <p style={styles.inlineError}>{error}</p>}
      </div>

      {/* ── Action Buttons ── */}
      <div style={styles.actionRow}>
        <ActionButton icon="↑" label="Send" onClick={handleSendInit} color="var(--accent-green)" />
        <ActionButton icon="↓" label="Receive" onClick={() => setActiveModal('receive')} color="var(--accent-purple)" />
        <ActionButton
          icon="⚡"
          label={airdropLoading ? '...' : 'Airdrop'}
          onClick={handleAirdrop}
          color="var(--accent-blue)"
          disabled={airdropLoading}
        />
        <ActionButton icon="↺" label="Refresh" onClick={fetchData} color="var(--text-secondary)" />
      </div>

      {/* Airdrop result message */}
      {airdropMsg && (
        <div className={`alert ${airdropMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}
          style={{ margin: '0 16px 8px', fontSize: 12 }}>
          {airdropMsg}
        </div>
      )}

      {/* ── Transaction History ── */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Recent Transactions</span>
          <span style={styles.sectionCount}>{txHistory.length}</span>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <span className="spinner" style={{ borderTopColor: 'var(--text-muted)' }} />
          </div>
        ) : txHistory.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No transactions yet.</p>
            <p style={styles.emptyHint}>Request an airdrop to get started!</p>
          </div>
        ) : (
          <div style={styles.txList}>
            {txHistory.map((tx, i) => (
              <TxItem key={tx.signature} tx={tx} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={styles.footer}>
        <button className="btn btn-danger btn-sm" onClick={handleDeleteWallet}>
          Delete Wallet
        </button>
        <span style={styles.footerNote}>Phase 1 · Local MVP</span>
      </div>

      {/* ════════════════════════════════════════
          MODALS
          ════════════════════════════════════════ */}

      {/* ── Send Modal ── */}
      {activeModal === 'send' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Send SOL</h3>
              <button style={styles.closeBtn} onClick={() => setActiveModal(null)}>✕</button>
            </div>

            {sendSuccess ? (
              <>
                <div className="alert alert-success" style={{ fontSize: 13 }}>{sendSuccess}</div>
                <a
                  href={explorerUrl(sendSuccess.split(': ')[1], 'tx')}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.explorerLink}
                >
                  View on Explorer →
                </a>
                <button className="btn btn-secondary" onClick={() => { setActiveModal(null); setSendSuccess('') }}>
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Recipient Address</label>
                  <input
                    className="input-field input-mono"
                    placeholder="Solana wallet address"
                    value={sendTo}
                    onChange={e => setSendTo(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Amount (SOL)
                    <span style={styles.balanceHint}>Balance: {formatSOL(balance)} SOL</span>
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.001"
                    value={sendAmount}
                    onChange={e => setSendAmount(e.target.value)}
                  />
                </div>

                {sendError && <div className="alert alert-error" style={{ fontSize: 12 }}>{sendError}</div>}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSendConfirm}
                    disabled={sendLoading}
                  >
                    {sendLoading ? <><span className="spinner" /> Sending...</> : 'Send →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Receive Modal ── */}
      {activeModal === 'receive' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Receive SOL</h3>
              <button style={styles.closeBtn} onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Share your address to receive SOL on Solana Devnet.
            </p>

            <div style={styles.receiveAddress}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all' }}>
                {publicKey}
              </span>
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleCopyAddress}
              style={{ marginTop: 12 }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Address'}
            </button>

            <a
              href={explorerUrl(publicKey, 'address')}
              target="_blank"
              rel="noreferrer"
              style={{ ...styles.explorerLink, display: 'block', marginTop: 12 }}
            >
              View on Solana Explorer →
            </a>
          </div>
        </div>
      )}

      {/* ── Unlock Modal (password for signing) ── */}
      {activeModal === 'unlock' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🔐 Confirm Password</h3>
              <button style={styles.closeBtn} onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Enter your wallet password to sign this transaction.
            </p>

            <div className="input-group">
              <label className="input-label">Wallet Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Your password"
                value={unlockPw}
                onChange={e => setUnlockPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlockAndExecute()}
                autoFocus
              />
            </div>

            {unlockError && <div className="alert alert-error" style={{ fontSize: 12 }}>{unlockError}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => { setActiveModal(null); setUnlockPw('') }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUnlockAndExecute}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────

function ActionButton({ icon, label, onClick, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flex: 1,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <span style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color,
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </button>
  )
}

function TxItem({ tx, index }) {
  const date = tx.blockTime
    ? new Date(tx.blockTime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Pending'

  return (
    <a
      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
      target="_blank"
      rel="noreferrer"
      style={styles.txItem}
    >
      <div style={styles.txIcon}>
        {tx.err ? '✕' : '✓'}
      </div>
      <div style={styles.txInfo}>
        <span style={styles.txSig}>{shortenAddress(tx.signature, 6)}</span>
        <span style={styles.txDate}>{date}</span>
      </div>
      <div style={{
        ...styles.txStatus,
        color: tx.err ? 'var(--danger)' : 'var(--accent-green)',
      }}>
        {tx.err ? 'Failed' : 'Success'}
      </div>
    </a>
  )
}

// ── Styles ──────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--border)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    display: 'flex',
    gap: 4,
  },
  networkPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent-green)',
    boxShadow: '0 0 6px var(--accent-green)',
    display: 'inline-block',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 16,
    padding: '6px',
    borderRadius: 8,
    transition: 'color 0.2s',
    fontFamily: 'var(--font-ui)',
  },
  balanceCard: {
    padding: '28px 20px 24px',
    textAlign: 'center',
    background: 'linear-gradient(180deg, rgba(20,241,149,0.03) 0%, transparent 100%)',
    borderBottom: '1px solid var(--border)',
  },
  addressRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 6px',
    borderRadius: 4,
  },
  balanceRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
    minHeight: 52,
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1,
    color: 'var(--text-primary)',
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--accent-green)',
    marginBottom: 6,
  },
  balanceUsd: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  inlineError: {
    fontSize: 12,
    color: 'var(--danger)',
    marginTop: 8,
  },
  actionRow: {
    display: 'flex',
    gap: 8,
    padding: '16px',
  },
  section: {
    flex: 1,
    padding: '0 16px 16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    background: 'var(--bg-input)',
    padding: '2px 8px',
    borderRadius: 100,
    border: '1px solid var(--border)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 0',
    gap: 4,
  },
  emptyText: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  emptyHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  txList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  txItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    textDecoration: 'none',
    transition: 'border-color 0.2s',
    cursor: 'pointer',
  },
  txIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--bg-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  txInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  txSig: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  txDate: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  txStatus: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerNote: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px',
    fontFamily: 'var(--font-ui)',
  },
  balanceHint: {
    marginLeft: 8,
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'none',
    letterSpacing: 0,
  },
  receiveAddress: {
    padding: '16px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    textAlign: 'center',
  },
  explorerLink: {
    fontSize: 12,
    color: 'var(--accent-blue)',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: 8,
  },
}
