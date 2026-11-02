import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DOCUMENT_KEY_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

const { encryptDocument, wrapDocumentKey, unwrapDocumentKey, decryptDocument } = await import('../src/services/cryptoService.js');

test('encrypts, wraps, unwraps, and decrypts a document', () => {
  const source = Buffer.from('private medical document');
  const encrypted = encryptDocument(source);
  const wrapped = wrapDocumentKey(encrypted.documentKey);
  const restored = decryptDocument(encrypted.encrypted, encrypted.metadata, unwrapDocumentKey(wrapped));
  assert.deepEqual(restored, source);
});

test('rejects tampered encrypted content', () => {
  const encrypted = encryptDocument(Buffer.from('private medical document'));
  encrypted.encrypted[0] ^= 1;
  assert.throws(() => decryptDocument(encrypted.encrypted, encrypted.metadata, encrypted.documentKey));
});
