/**
 * solana.js — Solana Blockchain Utilities
 *
 * Handles:
 *  - Connection to Solana Devnet
 *  - Balance fetching
 *  - SOL airdrop (devnet only)
 *  - Sending SOL transactions
 *  - Transaction history
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js'

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────

// Phase 1: Devnet for free testing
// Phase 4: Switch to 'mainnet-beta' for production
export const NETWORK = 'devnet'

// ─────────────────────────────────────────────
// 1. CONNECTION
// ─────────────────────────────────────────────

/**
 * Get a connection to the Solana network.
 * Uses 'confirmed' commitment for reliable balance reads.
 * @returns {Connection}
 */
export const getConnection = () => {
  return new Connection(clusterApiUrl(NETWORK), 'confirmed')
}

// ─────────────────────────────────────────────
// 2. BALANCE
// ─────────────────────────────────────────────

/**
 * Get SOL balance for a wallet address.
 * Converts lamports (raw units) to SOL.
 *   1 SOL = 1,000,000,000 lamports
 *
 * @param {string} publicKeyStr - Wallet's base58 public key
 * @returns {Promise<number>} Balance in SOL
 */
export const getBalance = async (publicKeyStr) => {
  const connection = getConnection()
  const publicKey  = new PublicKey(publicKeyStr)
  const lamports   = await connection.getBalance(publicKey)
  return lamports / LAMPORTS_PER_SOL
}

// ─────────────────────────────────────────────
// 3. AIRDROP (Devnet only)
// ─────────────────────────────────────────────

/**
 * Request a SOL airdrop from the Devnet faucet.
 * Devnet airdrop limit: 2 SOL per request, ~5 per day.
 *
 * @param {string} publicKeyStr - Wallet address
 * @param {number} amount       - SOL to request (default: 1)
 * @returns {Promise<string>}   Transaction signature
 */
export const requestAirdrop = async (publicKeyStr, amount = 1) => {
  const connection = getConnection()
  const publicKey  = new PublicKey(publicKeyStr)
  const lamports   = amount * LAMPORTS_PER_SOL

  const signature  = await connection.requestAirdrop(publicKey, lamports)

  // Wait for confirmation
  const latestBlockhash = await connection.getLatestBlockhash()
  await connection.confirmTransaction({
    signature,
    ...latestBlockhash,
  })

  return signature
}

// ─────────────────────────────────────────────
// 4. SEND SOL
// ─────────────────────────────────────────────

/**
 * Send SOL from one wallet to another.
 *
 * Transaction flow:
 *  1. Build transfer instruction
 *  2. Get recent blockhash (prevents replay attacks)
 *  3. Sign transaction locally with sender's keypair
 *  4. Broadcast to network
 *  5. Wait for confirmation
 *
 * @param {object} senderWalletData - { secretKey: number[] } from decrypted wallet
 * @param {string} toAddressStr     - Recipient's public key (base58)
 * @param {number} amount           - SOL amount to send
 * @returns {Promise<string>}       Transaction signature
 */
export const sendSOL = async (senderWalletData, toAddressStr, amount) => {
  const connection = getConnection()

  // Reconstruct keypair from stored secret key array
  const secretKey    = Uint8Array.from(senderWalletData.secretKey)
  const fromKeypair  = Keypair.fromSecretKey(secretKey)
  const toPublicKey  = new PublicKey(toAddressStr)
  const lamports     = Math.round(amount * LAMPORTS_PER_SOL)

  // Build the transfer transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey:   toPublicKey,
      lamports,
    })
  )

  // Attach a recent blockhash (required by Solana to prevent replay)
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromKeypair.publicKey

  // Sign and send
  const signature = await connection.sendTransaction(transaction, [fromKeypair])

  // Wait for confirmation
  const latestBlockhash = await connection.getLatestBlockhash()
  await connection.confirmTransaction({ signature, ...latestBlockhash })

  return signature
}

// ─────────────────────────────────────────────
// 5. TRANSACTION HISTORY
// ─────────────────────────────────────────────

/**
 * Fetch recent transaction signatures for an address.
 * @param {string} publicKeyStr
 * @param {number} limit - Number of transactions to fetch (max 100)
 * @returns {Promise<Array>} Array of transaction signature info
 */
export const getTransactionHistory = async (publicKeyStr, limit = 10) => {
  try {
    const connection = getConnection()
    const publicKey  = new PublicKey(publicKeyStr)
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit })
    return signatures
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// 6. HELPER / FORMATTING UTILITIES
// ─────────────────────────────────────────────

/**
 * Shorten a wallet address for display.
 * e.g. "7xKXtg...mNKQzA"
 * @param {string} address
 * @param {number} chars - Characters to show on each side
 * @returns {string}
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address || address.length < chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Check if a string is a valid Solana public key.
 * @param {string} address
 * @returns {boolean}
 */
export const isValidAddress = (address) => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Format SOL amount for display.
 * @param {number} amount
 * @returns {string}
 */
export const formatSOL = (amount) => {
  if (amount === null || amount === undefined) return '—'
  return amount.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

/**
 * Get Solana Explorer URL for a transaction or address.
 * @param {string} value - signature or address
 * @param {'tx'|'address'} type
 * @returns {string} Explorer URL (devnet)
 */
export const explorerUrl = (value, type = 'tx') => {
  return `https://explorer.solana.com/${type}/${value}?cluster=devnet`
}
