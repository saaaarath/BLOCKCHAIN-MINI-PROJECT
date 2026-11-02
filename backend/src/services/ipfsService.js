import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const approvedMimeTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/tiff',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

export const pinEncryptedDocument = async ({ data, originalName }) => {
  const form = new FormData();
  form.append('file', new Blob([data]), originalName);
  form.append('network', 'public');
  const response = await fetch('https://uploads.pinata.cloud/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.pinataJwt}` },
    body: form
  });
  if (!response.ok) {
    console.error('Pinata upload failed', response.status);
    throw new AppError(502, 'Encrypted document storage failed');
  }
  const result = await response.json();
  const cid = result.data?.cid || result.cid || result.IpfsHash;
  if (!cid) throw new AppError(502, 'IPFS did not return a CID');
  return cid;
};

export const fetchEncryptedDocument = async (cid) => {
  const gateways = [
    env.pinataGatewayUrl,
    'https://dweb.link',
    'https://ipfs.io'
  ].filter((gateway, index, values) => gateway && values.indexOf(gateway) === index);
  let lastStatus;
  for (const gateway of gateways) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${gateway}/ipfs/${encodeURIComponent(cid)}`, {
        headers: { Authorization: `Bearer ${env.pinataJwt}` },
        signal: controller.signal
      });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
      lastStatus = response.status;
    } catch (error) {
      lastStatus = error.name === 'AbortError' ? 'timeout' : error.message;
    } finally {
      clearTimeout(timeout);
    }
  }
  console.error('Encrypted document retrieval failed', { cid, lastStatus });
  throw new AppError(502, 'Encrypted document is unavailable from IPFS gateways');
};

export const hashMetadata = (metadata) => crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex');
