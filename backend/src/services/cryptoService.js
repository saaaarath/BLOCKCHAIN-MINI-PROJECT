import crypto from 'node:crypto';
import { env } from '../config/env.js';

const algorithm = 'aes-256-gcm';
const keyEncryptionKey = () => Buffer.from(env.documentKeyEncryptionKey, 'base64');

export const encryptDocument = (input) => {
  const documentKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, documentKey, iv);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    documentKey,
    metadata: { algorithm, iv: iv.toString('base64'), authTag: authTag.toString('base64'), contentType: 'application/octet-stream' }
  };
};

export const wrapDocumentKey = (documentKey) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, keyEncryptionKey(), iv);
  const wrapped = Buffer.concat([cipher.update(documentKey), cipher.final()]);
  return JSON.stringify({ iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), wrapped: wrapped.toString('base64') });
};

export const unwrapDocumentKey = (wrappedKey) => {
  const value = JSON.parse(wrappedKey);
  const decipher = crypto.createDecipheriv(algorithm, keyEncryptionKey(), Buffer.from(value.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(value.authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(value.wrapped, 'base64')), decipher.final()]);
};

export const decryptDocument = (encrypted, metadata, documentKey) => {
  const decipher = crypto.createDecipheriv(algorithm, documentKey, Buffer.from(metadata.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(metadata.authTag, 'base64'));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};
