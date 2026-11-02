import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['PATIENT', 'DOCTOR'], required: true },
  walletAddress: { type: String, required: true, unique: true, lowercase: true, trim: true },
  specialization: { type: String, trim: true },
  organization: { type: String, trim: true },
  accountStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' }
}, { timestamps: { createdAt: true, updatedAt: true } });

export const User = mongoose.model('User', userSchema);
