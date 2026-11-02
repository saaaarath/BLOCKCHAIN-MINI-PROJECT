# Runtime Validation Report

**Generated**: 2026-11-03  
**Target**: `C:\Users\admin\Desktop\BLOCKCHAIN MINI PROJECT`

## Summary

| Step | Status | Exit code | Details |
|---|---|---:|---|
| Startup | PASS | n/a | MongoDB, Hardhat, Express, and Vite were started locally |
| Backend unit tests | PASS | 0 | 2 encryption tests |
| API integration tests | PASS | 0 | 3 multi-step tests; 3 passed |
| Solidity tests | PASS | 0 | 5 Hardhat tests passed |
| Solidity compilation | PASS | 0 | Contract compiled successfully |
| Frontend build | PASS | 0 | Vite production build completed |
| Browser E2E | PASS | 0 | 3 Playwright smoke tests passed |
| Ethers read integration | PASS | 0 | Live deployed contract returned records/access requests |
| Pinata authentication | PASS | 0 | JWT authentication endpoint succeeded |
| Pinata encrypted upload | FAIL | 1 | Upload endpoint returned HTTP 401; token lacks upload permission |

## Environment verdict

```text
environment:
  docker: UNAVAILABLE — docker daemon was not responding
  node: AVAILABLE — v22.13.0
  playwright: AVAILABLE — browser installed and 3 tests passed
  infra-tier: FALLBACK(local MongoDB + local Hardhat) — Docker unavailable
  browser-tier: PRIMARY(Playwright) — Chromium installed and executed
startup: PASS — mongod, hardhat node, backend health, and Vite readiness verified
integration: PASS — exit_code: 0, passed: 3, failed: 0, skipped: 0, API/security scope
e2e: PASS — exit_code: 0, passed: 3, failed: 0, public/auth/protected-route flows
overall: NEEDS_SIGNOFF — core local stack passes, but Pinata upload permission and MetaMask-driven workflows remain environment-gated
```

## Test evidence

### Backend/API

Command:

```powershell
$env:RUN_INTEGRATION_TESTS='1'
$env:MONGODB_URI='mongodb://127.0.0.1:27017/phr'
$env:TEST_BASE_URL='http://127.0.0.1:5000'
npm run test:integration
```

Verified:

- Registration and persistence
- Login and `/api/auth/me`
- Invalid JWT rejection
- Expired JWT rejection
- Patient blocked from doctor-only patient directory
- Unsupported upload MIME type rejected with 415
- Patient and doctor record views remain isolated
- Live blockchain history endpoint

### Browser

```powershell
npx playwright test
```

Verified:

- Landing page renders
- Registration fields and accessible controls render
- Unauthenticated `/app` redirects to login

### Blockchain

```powershell
npm run compile
npm run test:contracts
npm run deploy:local
```

The final local deployment address was written to the backend/frontend environment files and ABI artifact:

```text
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

The contract now requires a patient wallet registration before record registration and prevents registered doctors from registering as patients.

### Pinata

Authentication passed:

```powershell
Invoke-RestMethod https://api.pinata.cloud/data/testAuthentication ...
```

The real encrypted upload attempt reached Pinata but returned HTTP 401 from `https://uploads.pinata.cloud/v3/files`. This is a Pinata key permission/configuration failure, not a local mock. Create or update the JWT with file-upload permission, then repeat the encrypted upload test.

## Full demonstration status

The following were verified automatically:

- Patient/doctor registration and login
- JWT and role boundaries
- AES-256-GCM encryption and tamper rejection
- Local Ethereum deployment and read-only Ethers calls
- Solidity record/access/revocation tests
- Frontend route rendering

The following remain unverified in this environment:

- MetaMask signatures and account-change events
- Real patient upload through the browser
- Real Pinata CID creation/retrieval, blocked by the current JWT's HTTP 401
- Doctor request/approval/revocation browser journey
- Post-revocation document download denial through a real uploaded document

These are not claimed as passing.

## Issues found and fixed

1. Frontend contract code ignored configured contract/chain environment values. It now uses `VITE_CONTRACT_ADDRESS` and rejects the wrong chain ID.
2. Pinata client used the legacy upload endpoint/response shape. It now uses `uploads.pinata.cloud/v3/files`, sends `network=public`, and accepts the current `data.cid` response shape.
3. Unsupported MIME uploads were silently treated as missing files. They now return HTTP 415.
4. The contract allowed any non-registered address to register records. Patients now self-register on-chain, and registered doctors are rejected as patients.
5. Wallet actions now require the connected MetaMask account to match the authenticated user's registered wallet.
