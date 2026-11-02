import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ipfsCid: { type: String, required: true },
  encryptedFileMetadata: { type: Object, required: true },
  metadataHash: { type: String, required: true },
  blockchainTransactionHash: { type: String, trim: true },
  blockchainRecordId: { type: String, trim: true },
  wrappedDocumentKey: { type: String, required: true, select: false }
}, { timestamps: true });

export const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
