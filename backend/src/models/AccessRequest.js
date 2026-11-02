import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'], default: 'PENDING' },
  transactionHash: { type: String, trim: true }
}, { timestamps: { createdAt: 'requestedAt', updatedAt: 'updatedAt' } });

accessRequestSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });
export const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);
