/**
 * wallet.js — Core Wallet Utilities
 *
 * Handles:
 *  - Mnemonic (seed phrase) generation
 *  - Solana Keypair derivation from mnemonic
 *  - AES encryption / decryption of wallet data
 *  - Saving and loading wallet from localStorage
 *  - Session management (public key only, no sensitive data)
 */

import * as bip39 from 'bip39'
import { Keypair } from '@solana/web3.js'
import { derivePath } from 'ed25519-hd-key'
import CryptoJS from 'crypto-js'

// BIP44 derivation path for Solana (used by Phantom, Solflare)
const SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'"

// Storage keys
const STORAGE_KEY_WALLET   = 'cv_encrypted_wallet'
const STORAGE_KEY_SESSION  = 'cv_session_pubkey'

// ─────────────────────────────────────────────
// 1. MNEMONIC GENERATION
// ─────────────────────────────────────────────

/**
 * Generate a new 12-word BIP39 mnemonic phrase.
 * @returns {string} 12-word mnemonic
 */
export const generateMnemonic = () => {
  return bip39.generateMnemonic() // 128-bit entropy → 12 words
}

/**
 * Validate a mnemonic phrase.
 * @param {string} mnemonic
 * @returns {boolean}
 */
export const validateMnemonic = (mnemonic) => {
  return bip39.validateMnemonic(mnemonic.trim().toLowerCase())
}

// ─────────────────────────────────────────────
// 2. KEYPAIR DERIVATION
// ─────────────────────────────────────────────

/**
 * Derive a Solana Keypair from a BIP39 mnemonic.
 * Uses the standard Solana derivation path: m/44'/501'/0'/0'
 *
 * @param {string} mnemonic - 12-word seed phrase
 * @returns {Promise<Keypair>} Solana Keypair
 */
export const keypairFromMnemonic = async (mnemonic) => {
  const cleaned = mnemonic.trim().toLowerCase()

  if (!bip39.validateMnemonic(cleaned)) {
    throw new Error('Invalid mnemonic phrase. Please check your 12 words.')
  }

  // Convert mnemonic → 64-byte seed buffer
  const seed = await bip39.mnemonicToSeed(cleaned)

  // Derive child key using BIP44 path for Solana
  const { key } = derivePath(SOLANA_DERIVATION_PATH, seed.toString('hex'))

  // Create Solana keypair from 32-byte seed
  return Keypair.fromSeed(key)
}

// ─────────────────────────────────────────────
// 3. ENCRYPTION / DECRYPTION
// ─────────────────────────────────────────────

/**
 * Encrypt wallet data using AES-256 with a user password.
 * @param {object} walletData - { mnemonic, publicKey, secretKey }
 * @param {string} password
 * @returns {string} AES ciphertext string
 */
export const encryptWallet = (walletData, password) => {
  const json = JSON.stringify(walletData)
  return CryptoJS.AES.encrypt(json, password).toString()
}

/**
 * Decrypt AES-encrypted wallet data.
 * @param {string} ciphertext
 * @param {string} password
 * @returns {object} Decrypted wallet data
 * @throws {Error} if password is wrong or data is corrupted
 */
export const decryptWallet = (ciphertext, password) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password)
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)

    if (!decryptedStr) {
      throw new Error('Empty result')
    }

    return JSON.parse(decryptedStr)
  } catch {
    throw new Error('Incorrect password or corrupted wallet data.')
  }
}

// ─────────────────────────────────────────────
// 4. SAVE / LOAD WALLET
// ─────────────────────────────────────────────

/**
 * Save a new wallet to localStorage (encrypted).
 * Stores: mnemonic, publicKey, secretKey — all AES-encrypted.
 *
 * @param {string}  mnemonic  - 12-word seed phrase
 * @param {Keypair} keypair   - Solana Keypair
 * @param {string}  password  - User's wallet password
 * @returns {string} public key string
 */
export const saveWallet = (mnemonic, keypair, password) => {
  const walletData = {
    mnemonic,
    publicKey: keypair.publicKey.toString(),
    // Store secretKey as plain array (it will be encrypted)
    secretKey: Array.from(keypair.secretKey),
    createdAt: Date.now(),
  }

  const encrypted = encryptWallet(walletData, password)
  localStorage.setItem(STORAGE_KEY_WALLET, encrypted)

  return walletData.publicKey
}

/**
 * Load and decrypt wallet from localStorage.
 * @param {string} password
 * @returns {object|null} wallet data or null if not found
 */
export const loadWallet = (password) => {
  const ciphertext = localStorage.getItem(STORAGE_KEY_WALLET)
  if (!ciphertext) return null
  return decryptWallet(ciphertext, password)
}

/**
 * Check if an encrypted wallet exists in localStorage.
 * @returns {boolean}
 */
export const walletExists = () => {
  return !!localStorage.getItem(STORAGE_KEY_WALLET)
}

/**
 * Permanently delete wallet from localStorage.
 * ⚠️ Irreversible — user loses wallet without mnemonic backup.
 */
export const deleteWallet = () => {
  localStorage.removeItem(STORAGE_KEY_WALLET)
  clearSession()
}

// ─────────────────────────────────────────────
// 5. SESSION MANAGEMENT
// ─────────────────────────────────────────────
// Session stores only the PUBLIC KEY — never the private key.
// This allows the UI to show address/balance without unlocking.
// Private key is only in memory during active signing operations.

/**
 * Save current session (public key only).
 * @param {string} publicKey
 */
export const saveSession = (publicKey) => {
  sessionStorage.setItem(STORAGE_KEY_SESSION, publicKey)
}

/**
 * Get the current session public key.
 * @returns {string|null}
 */
export const getSession = () => {
  return sessionStorage.getItem(STORAGE_KEY_SESSION)
}

/**
 * Clear the session (logout).
 */
export const clearSession = () => {
  sessionStorage.removeItem(STORAGE_KEY_SESSION)
}
