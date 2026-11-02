# Initial Architecture

The frontend communicates with the backend for application data and connects to Ethereum through MetaMask for record-reference registration and access control. MongoDB stores application metadata and user profiles. IPFS integration is intentionally deferred; the contract accepts only an opaque CID/reference and metadata hash.
