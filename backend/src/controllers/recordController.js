import crypto from 'node:crypto';
import multer from 'multer';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { encryptDocument, wrapDocumentKey, unwrapDocumentKey, decryptDocument } from '../services/cryptoService.js';
import { approvedMimeTypes, fetchEncryptedDocument, hashMetadata, pinEncryptedDocument } from '../services/ipfsService.js';
import { hasBlockchainAccess, readPatientRecords, verifyRecordTransaction } from '../services/blockchainService.js';
import { audit } from '../services/auditService.js';
import { env } from '../config/env.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (_req, file, callback) => {
    if (!approvedMimeTypes.has(file.mimetype)) return callback(new AppError(415, 'Unsupported medical document type'));
    callback(null, true);
  }
});

export const uploadRecord = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'Approved medical document file is required');
    const { title, category, description, blockchainTransactionHash, blockchainRecordId } = req.body;
    if (!title || !category) throw new AppError(400, 'title and category are required');
    const { encrypted, documentKey, metadata } = encryptDocument(req.file.buffer);
    metadata.originalName = req.file.originalname;
    metadata.originalMimeType = req.file.mimetype;
    const recordId = blockchainRecordId || crypto.randomUUID();
    const metadataHash = hashMetadata(metadata);
    const ipfsCid = await pinEncryptedDocument({ data: encrypted, originalName: `${recordId}.encrypted` });
    let transactionHash;
    if (blockchainTransactionHash) transactionHash = await verifyRecordTransaction(blockchainTransactionHash, req.user.walletAddress, recordId);
    const record = await MedicalRecord.create({ recordId, patientId: req.user._id, title, category, description, ipfsCid, encryptedFileMetadata: metadata, metadataHash, blockchainTransactionHash: transactionHash, blockchainRecordId: recordId, wrappedDocumentKey: wrapDocumentKey(documentKey) });
    await audit(req.user._id, 'RECORD_UPLOADED', { recordId, transactionHash });
    res.status(201).json({ record: { id: record._id, recordId, title, category, ipfsCid, metadataHash, blockchainTransactionHash: transactionHash } });
  } catch (error) { next(error); }
};

const canRead = async (record, user) => {
  if (record.patientId.toString() === user._id.toString()) return true;
  const patient = await User.findById(record.patientId);
  return user.role === 'DOCTOR' && patient && await hasBlockchainAccess(patient.walletAddress, user.walletAddress);
};

export const listRecords = async (req, res, next) => {
  try {
    const query = req.user.role === 'PATIENT' ? { patientId: req.user._id } : {};
    const candidates = await MedicalRecord.find(query).select('-wrappedDocumentKey');
    const records = req.user.role === 'PATIENT'
      ? candidates
      : (await Promise.all(candidates.map(async (record) => (await canRead(record, req.user) ? record : null)))).filter(Boolean);
    res.json({ records });
  } catch (e) { next(e); }
};

export const getRecord = async (req, res, next) => { try { const record = await MedicalRecord.findOne({ recordId: req.params.recordId }).select('-wrappedDocumentKey'); if (!record || !(await canRead(record, req.user))) throw new AppError(404, 'Record not found'); res.json({ record }); } catch (e) { next(e); } };

export const downloadRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ recordId: req.params.recordId }).select('+wrappedDocumentKey');
    if (!record || !(await canRead(record, req.user))) throw new AppError(403, 'Current blockchain authorization required');
    const encrypted = await fetchEncryptedDocument(record.ipfsCid);
    const data = decryptDocument(encrypted, record.encryptedFileMetadata, unwrapDocumentKey(record.wrappedDocumentKey));
    await audit(req.user._id, 'RECORD_DOWNLOADED', { recordId: record.recordId });
    res.type(record.encryptedFileMetadata.originalMimeType).send(data);
  } catch (e) { next(e); }
};

export const deleteRecord = async (req, res, next) => { try { const record = await MedicalRecord.findOne({ recordId: req.params.recordId, patientId: req.user._id }); if (!record) throw new AppError(404, 'Record not found'); await record.deleteOne(); await audit(req.user._id, 'RECORD_DELETED', { recordId: record.recordId }); res.status(204).send(); } catch (e) { next(e); } };
export const indexBlockchainRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ recordId: req.params.recordId, patientId: req.user._id });
    if (!record) throw new AppError(404, 'Record not found');
    const transactionHash = await verifyRecordTransaction(req.body.transactionHash, req.user.walletAddress, record.recordId);
    record.blockchainTransactionHash = transactionHash;
    await record.save();
    await audit(req.user._id, 'RECORD_REGISTERED', { recordId: record.recordId, transactionHash });
    res.json({ record: { recordId: record.recordId, blockchainTransactionHash: transactionHash } });
  } catch (e) { next(e); }
};
export const blockchainHistory = async (req, res, next) => { try { res.json({ records: await readPatientRecords(req.user.walletAddress) }); } catch (e) { next(e); } };
