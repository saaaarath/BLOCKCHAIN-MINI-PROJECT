import 'dotenv/config';

const required = (name, fallback) => process.env[name] || fallback;

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGODB_URI'),
  frontendOrigin: required('FRONTEND_ORIGIN', 'http://localhost:5173'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: required('JWT_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '7d'),
  pinataJwt: required('PINATA_JWT'),
  pinataGatewayUrl: required('PINATA_GATEWAY_URL', 'https://gateway.pinata.cloud'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
  documentKeyEncryptionKey: required('DOCUMENT_KEY_ENCRYPTION_KEY'),
  blockchainRpcUrl: required('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545'),
  blockchainContractAddress: required('BLOCKCHAIN_CONTRACT_ADDRESS'),
  trustedBlockchainConfirmations: Number(process.env.TRUSTED_BLOCKCHAIN_CONFIRMATIONS || 1)
};

export const validateEnvironment = () => {
  const missing = ['MONGODB_URI', 'JWT_SECRET', 'PINATA_JWT', 'DOCUMENT_KEY_ENCRYPTION_KEY', 'BLOCKCHAIN_CONTRACT_ADDRESS']
    .filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (!Number.isInteger(env.maxUploadBytes) || env.maxUploadBytes <= 0) throw new Error('MAX_UPLOAD_BYTES must be positive');
  const key = Buffer.from(env.documentKeyEncryptionKey, 'base64');
  if (key.length !== 32) throw new Error('DOCUMENT_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
};
