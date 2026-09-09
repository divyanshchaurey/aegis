# SecureAssetPortal: Blockchain-Based Decentralized Identity & Asset Management Portal

A production-ready Web3 prototype implementing **Role-Based Access Control (RBAC)**, **Decentralized Identity (DID)**, and **ERC-721 Asset NFT Management** using **Next.js (App Router)**, **Tailwind CSS**, **Solidity (^0.8.20)**, and **Ethers.js (v6)**.

---

## 🏛️ Core Architecture

```
                                  +---------------------------------------+
                                  |    Next.js Dashboard (App Router)     |
                                  |     • Auto-Role Detection (hasRole)   |
                                  |     • Admin Console / User ID Card    |
                                  |     • Public Compliance Auditor Feed  |
                                  +-------------------+-------------------+
                                                      |
                                           Ethers.js v6 Provider
                                                      |
                                                      v
+-----------------------------+           +---------------------------------------+
|  Decentralized Storage      |           |     Smart Contract: SecureAssetPortal |
|  • IPFS / Pinata JSON       | <-------  |     • OpenZeppelin ERC721URIStorage   |
|  • Metadata URI Persistence |           |     • OpenZeppelin AccessControl      |
|                             |           |     • RBAC: Admin, Manager, Auditor   |
+-----------------------------+           |     • Replay-Safe Nonce Checkpoint    |
                                          +---------------------------------------+
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MetaMask** or any EIP-1193 compatible Web3 browser wallet

### 2. Install & Compile
```bash
# Compile Solidity contracts
npm run compile

# Run Hardhat unit tests (10 passing tests)
npm test
```

### 3. Local Development (Instant Testing)
Start the Next.js frontend dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!TIP]
> **Zero-Setup Persona Preview**: If you do not have MetaMask installed or connected yet, you can test the application immediately using the built-in **Quick Persona Preview** buttons in the toolbar (`Admin DID`, `Manager DID`, `Employee DID`, `Auditor DID`) to preview all UI states, RBAC views, and server access simulations!

---

## 🔐 Deploying to Sepolia or Polygon Amoy

### 1. Configure Environment Variables
Create a `.env.local` file based on `.env.example`:
```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_private_key_without_0x

NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Optional Pinata IPFS keys (fallback generates IPFS data URIs)
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### 2. Deploy
```bash
# Deploy to Ethereum Sepolia
npm run deploy:sepolia

# Deploy to Polygon Amoy
npm run deploy:amoy

# Deploy to local Hardhat node
npx hardhat node
npm run deploy:local
```
The deploy script automatically updates `lib/contracts/SecureAssetPortal.json` with the deployed address and ABI.

---

## 📂 Project Structure

```
decentralized-asset-portal/
├── contracts/
│   └── SecureAssetPortal.sol       # Consolidated ERC721URIStorage + AccessControl contract
├── scripts/
│   └── deploy.js                   # Hardhat deployment script exporting ABI & address
├── test/
│   └── SecureAssetPortal.test.js   # 10 automated unit tests
├── lib/
│   ├── contracts/
│   │   └── SecureAssetPortal.json  # Exported ABI & contract address
│   └── web3.js                     # Ethers.js v6 helper modules (wallet, transactions, IPFS)
├── app/
│   ├── globals.css                 # Cyber-themed dark mode styles & glassmorphism
│   ├── layout.js                   # Next.js root layout
│   └── page.js                     # Master dashboard orchestrating tabs & auto-switching
├── components/
│   ├── Header.js                   # Header with wallet connect, network & role badges
│   ├── AdminTab.js                 # Role assignment form & IPFS asset minting form
│   ├── UserTab.js                  # Digital ID card, session verification, inventory & simulator
│   └── AuditorTab.js               # Real-time contract event activity ticker & search
├── tailwind.config.js              # Custom theme colors, animations & borders
└── hardhat.config.js               # Hardhat config with Cancun EVM support
```

---

## 🛡️ Smart Contract Features (`SecureAssetPortal.sol`)

1. **Role-Based Access Control**:
   - `DEFAULT_ADMIN_ROLE`: Root governance; can grant/revoke any role via `assignRole` and `revokeRolePortal`.
   - `MANAGER_ROLE`: Operational manager authorized to mint corporate ERC-721 asset tokens via `mintAsset(to, metadataURI)`.
   - `AUDITOR_ROLE`: Surveillance & compliance auditing.
2. **On-Chain Session Checkpointing**:
   - `enterSystem()` / `verifyAndEnter()`: Updates `lastAccessTime[msg.sender] = block.timestamp`, increments `userNonces[msg.sender]` to prevent replay attacks, and emits indexed event `SystemEntered`.
3. **Decentralized Asset Enumeration**:
   - `getOwnedTokens(address owner)`: O(1) read helper for instant frontend inventory listing.
   - `getUserStatus(address account)`: Aggregated single-RPC query for roles, nonce, last entry, and balance.
