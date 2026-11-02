# CareLedger — Blockchain-Based Personal Health Records

CareLedger is an academic prototype for patient-controlled health records. Medical documents are encrypted with AES-256-GCM before Pinata/IPFS storage. Ethereum stores only opaque record references, hashes, timestamps, and access permissions; it never stores medical contents or encryption keys.

## Features

- React/Vite patient and doctor workspaces
- JWT authentication and bcrypt password hashing
- MongoDB users, records, access requests, and audit logs
- AES-256-GCM encryption with per-document keys and backend KEK wrapping
- Pinata encrypted-file upload and retrieval
- Hardhat/Ethereum record registration and permission checks
- MetaMask wallet-signed record and access transactions
- Blockchain authorization checked before document key release
- Responsive records, directory, access, dashboard, history, and settings screens

## Architecture

```text
React + MetaMask
       │ REST/JWT                 wallet-signed transactions
       ▼                                      │
Express + Mongoose ───── read-only Ethers provider ─── Ethereum
       │
AES-256-GCM ─── encrypted bytes ─── Pinata/IPFS
       │
MongoDB: users, metadata, wrapped keys, audit logs
```

The backend never receives or stores wallet private keys. MongoDB access status is not authoritative: doctor access is rechecked against `hasAccess(patientWallet, doctorWallet)` on the current contract before download/decryption.

## Folder structure

- `frontend/` React/Vite UI, wallet client, API client, Playwright smoke tests
- `backend/` Express API, authentication, encryption, Pinata and Ethers services
- `blockchain/` Solidity contract, Hardhat configuration, deployment and tests
- `docs/` architecture notes

## Prerequisites

- Node.js 20+ and npm 10+
- MongoDB Community Server 8+ or another MongoDB instance
- MetaMask for browser wallet flows
- Pinata account with an upload-enabled JWT

Docker was not required for local validation. The local MongoDB and Hardhat processes are used instead.

## Installation

From the project root:

```powershell
npm install
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Never commit `.env` files. `.gitignore` excludes them.

## Environment configuration

### Backend

Set values in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/phr
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=long_random_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PINATA_JWT=upload_enabled_pinata_jwt
PINATA_GATEWAY_URL=https://gateway.pinata.cloud
MAX_UPLOAD_BYTES=10485760
DOCUMENT_KEY_ENCRYPTION_KEY=base64_32_byte_key
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CONTRACT_ADDRESS=deployed_address
TRUSTED_BLOCKCHAIN_CONFIRMATIONS=1
```

Generate the KEK:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Frontend

Set `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CHAIN_ID=31337
VITE_CONTRACT_ADDRESS=deployed_address
VITE_BLOCKCHAIN_EXPLORER_URL=
```

Only public configuration belongs in the frontend. Never place `PINATA_JWT`, `JWT_SECRET`, or `DOCUMENT_KEY_ENCRYPTION_KEY` there.

### Blockchain

`blockchain/.env.example` documents local/public deployment variables. Local deployment does not require a private key.

## Starting locally

Use separate PowerShell terminals.

### 1. MongoDB

```powershell
New-Item -ItemType Directory -Force C:\data\db
mongod --dbpath C:\data\db
```

If MongoDB is already running, do not start a second instance.

### 2. Hardhat node

```powershell
npm run dev:blockchain
```

### 3. Deploy the contract

```powershell
npm run deploy:local
```

Copy the printed address into both `backend/.env` and `frontend/.env`. The deployment script also updates `frontend/src/contracts/PersonalHealthRecord.json`.

### 4. Backend

```powershell
npm run dev:backend
```

Check readiness:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

### 5. Frontend

```powershell
npm run dev:frontend
```

Open `http://localhost:5173`.

## Pinata setup

Create an API key/JWT in the Pinata dashboard with file upload permission. Set the complete JWT only in `backend/.env`. Verify authentication:

```powershell
$token = ((Get-Content backend\.env | Where-Object { $_ -like 'PINATA_JWT=*' }) -split '=', 2)[1]
Invoke-RestMethod https://api.pinata.cloud/data/testAuthentication -Headers @{ Authorization = "Bearer $token" }
```

The backend uploads encrypted bytes through `https://uploads.pinata.cloud/v3/files` with `network=public`. A valid authentication token without upload scope will still receive HTTP 401.

## MetaMask local network

Add a custom network:

- Network name: Hardhat Local
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: ETH

Import a test account from the Hardhat node output. Never use real funds or real private keys for this local network.

## API documentation

All protected routes use `Authorization: Bearer <accessToken>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Users | `GET/PUT /api/users/profile`, `PUT /api/users/password`, `GET /api/users/doctors`, `GET /api/users/patients` |
| Records | `POST /api/records/upload`, `GET /api/records`, `GET /api/records/:recordId`, `GET /api/records/:recordId/download`, `PATCH /api/records/:recordId/blockchain`, `DELETE /api/records/:recordId` |
| Access | `POST /api/access/request`, `GET /api/access/requests`, `POST /api/access/approve`, `POST /api/access/reject`, `POST /api/access/revoke` |
| Blockchain | `GET /api/blockchain/history`, `GET /api/blockchain/record/:transactionHash` |
| Dashboard | `GET /api/dashboard/patient`, `GET /api/dashboard/doctor` |

## Tests and validation

```powershell
npm test
npm run test:integration
npm run build:frontend
npm run compile
npm run test:contracts
npx playwright test
```

The integration suite requires MongoDB, Hardhat, and the backend to be running:

```powershell
$env:RUN_INTEGRATION_TESTS='1'
$env:MONGODB_URI='mongodb://127.0.0.1:27017/phr'
$env:TEST_BASE_URL='http://127.0.0.1:5000'
npm run test:integration
```

## Security architecture

- Passwords are bcrypt hashes; plaintext passwords are never persisted.
- JWTs are short-lived access tokens.
- Helmet, CORS allowlisting, rate limiting, upload limits, and MIME validation are enabled.
- Files are encrypted and authenticated before Pinata upload.
- Per-document keys are wrapped with a backend-only 32-byte KEK.
- Wrapped keys are excluded from normal API responses.
- CIDs are references, not authorization credentials.
- Blockchain state is rechecked for doctor downloads.
- Revocation blocks future downloads but cannot erase a file already decrypted or downloaded.
- Private keys and Pinata secrets never enter frontend source.

## Demonstration workflow

1. Register a patient with the MetaMask wallet address.
2. Log in and connect MetaMask on Hardhat Local.
3. Upload an approved PDF; confirm encryption/IPFS and sign `addMedicalRecord`.
4. Confirm the record and transaction in Medical Records/Blockchain History.
5. Register a doctor with another Hardhat wallet; owner-register that doctor in the contract if needed.
6. Doctor requests access; patient approves with a MetaMask transaction.
7. Doctor downloads only after current on-chain authorization succeeds.
8. Patient revokes access with MetaMask.
9. Repeat the download; backend must deny it.

## Troubleshooting

- `EADDRINUSE`: the service is already running; do not start a second MongoDB, Hardhat, or backend process.
- MongoDB `DBPathInUse`: another `mongod` already owns `C:\data\db`.
- Pinata HTTP 401: authentication may pass while upload permission is missing; create a JWT with upload scope.
- Wrong MetaMask network: use chain ID `31337`.
- Contract mismatch: redeploy and copy the new address to both `.env` files.
- Backend startup validation errors: fill every required value in `backend/.env`.

## Known limitations

- MetaMask browser signing cannot be automated in the CLI test environment.
- Live Pinata upload depends on the configured JWT's upload permission and network availability.
- The prototype does not implement production refresh-token rotation, key rotation, malware scanning, or enterprise identity federation.
