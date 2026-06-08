# CryptoVault — Phase 1: Local Wallet MVP

A decentralized Solana wallet built with React.
This is **Phase 1** of a 6-phase Chrome Extension crypto wallet project.

---

## What's Built in Phase 1

| Feature               | Status |
|-----------------------|--------|
| Wallet generation     | ✅     |
| 12-word seed phrase   | ✅     |
| Wallet import         | ✅     |
| AES-256 encryption    | ✅     |
| Solana Devnet connect | ✅     |
| Balance fetching      | ✅     |
| SOL transfer          | ✅     |
| Devnet airdrop        | ✅     |
| Transaction history   | ✅     |
| Password-protected    | ✅     |
| Session management    | ✅     |

---

## Tech Stack

- **React 18** + **Vite** — Frontend
- **@solana/web3.js** — Blockchain interaction
- **bip39** — Mnemonic (seed phrase) generation
- **ed25519-hd-key** — BIP44 key derivation for Solana
- **crypto-js** — AES-256 wallet encryption
- **tweetnacl** — Ed25519 cryptography

---

## Prerequisites

Make sure you have installed:
- **Node.js** v18 or higher → https://nodejs.org
- **npm** (comes with Node.js)

Check versions:
```bash
node --version   # Should be v18+
npm --version    # Should be 9+
```

---

## Setup & Run

### Step 1 — Clone or download the project

```bash
# If using git
git clone <your-repo-url>
cd phase1-wallet

# OR just navigate to the folder
cd phase1-wallet
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json`.
It may take 1–2 minutes (Solana packages are large).

### Step 3 — Start development server

```bash
npm run dev
```

Open your browser and go to:
```
http://localhost:5173
```

---

## How to Use

### Creating a New Wallet

1. Click **"Create New Wallet"**
2. Your 12-word seed phrase appears — **write it down safely**
3. Click to reveal, tick the confirmation checkbox
4. Set a strong password (min 8 characters)
5. Click **"Create Wallet"** → you're in!

### Getting Test SOL (Devnet)

1. On the Dashboard, click **"⚡ Airdrop"**
2. Wait 3–5 seconds
3. 1 SOL will appear in your balance
4. *(Devnet SOL has no real value — it's for testing)*

### Sending SOL

1. Click **"↑ Send"**
2. Enter a recipient address (another Solana Devnet wallet)
3. Enter amount
4. Click "Send →"
5. Enter your password to sign the transaction
6. Done! Transaction appears in history

### Importing an Existing Wallet

1. On Welcome screen, click **"Import Existing Wallet"**
2. Enter your 12-word seed phrase
3. Set a new password for this device
4. Click **"Import Wallet"**

---

## Project Structure

```
phase1-wallet/
├── index.html              ← HTML entry point (Google Fonts loaded here)
├── vite.config.js          ← Vite config with Node.js polyfills
├── package.json            ← Dependencies
│
└── src/
    ├── main.jsx            ← React entry point
    ├── App.jsx             ← Main router (welcome/create/import/unlock/dashboard)
    ├── App.css             ← Global styles (CSS variables, components)
    │
    ├── utils/
    │   ├── wallet.js       ← Mnemonic, encryption, localStorage
    │   └── solana.js       ← Blockchain: balance, send, airdrop, history
    │
    └── components/
        ├── WelcomePage.jsx ← Landing screen
        ├── CreateWallet.jsx← Seed phrase + password setup
        ├── ImportWallet.jsx← Restore from seed phrase
        └── Dashboard.jsx   ← Main wallet UI
```

---

## Security Notes (Phase 1)

| What                    | How                                        |
|-------------------------|--------------------------------------------|
| Private key storage     | AES-256 encrypted in localStorage          |
| Transaction signing     | Done locally in browser, key never sent    |
| Session                 | Public key only in sessionStorage          |
| Network                 | Solana Devnet (safe for testing)           |

> **Phase 5** will add a full security hardening layer.
> **Phase 4** will add AWS S3 encrypted cloud backup.

---

## Common Issues

### "Module not found" error
```bash
npm install   # Re-run to install missing packages
```

### "Cannot find global / Buffer" error
This is handled by `vite-plugin-node-polyfills` in `vite.config.js`.
Make sure it's listed in `devDependencies` and installed.

### Airdrop failed
- Devnet has rate limits (~5 airdrops/day per address)
- Wait a few minutes and retry

### Balance not updating
- Click the **↺ Refresh** button
- Balance auto-refreshes every 30 seconds

---

## What's Coming Next

| Phase | What Gets Built                              |
|-------|----------------------------------------------|
| **2** | Convert to Chrome Extension (Manifest V3)    |
| **3** | Node.js + Express backend APIs               |
| **4** | AWS EC2 + S3 cloud integration               |
| **5** | Security hardening (JWT, HTTPS, rate limits) |
| **6** | Final deployment & demo                      |

---

## Solana Devnet Resources

- **Solana Explorer (Devnet):** https://explorer.solana.com/?cluster=devnet
- **Devnet Faucet:** https://faucet.solana.com
- **Solana Docs:** https://docs.solana.com

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.
(In Phase 2, this `dist/` becomes the Chrome Extension package.)
