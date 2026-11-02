import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  recordId: { type: String, trim: true },
  transactionHash: { type: String, trim: true }
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
