import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { verifyWallet } from '../services/blockchainService.js';

export const profile = (req, res) => res.json({ user: req.user });

export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'walletAddress', 'specialization', 'organization'];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (changes.walletAddress) changes.walletAddress = verifyWallet(changes.walletAddress);
    const user = await User.findByIdAndUpdate(req.user._id, changes, { new: true, runValidators: true });
    res.json({ user });
  } catch (error) { next(error.code === 11000 ? new AppError(409, 'Wallet address already exists') : error); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!currentPassword || !newPassword || newPassword.length < 12 || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new AppError(400, 'Invalid password change request');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.status(204).send();
  } catch (error) { next(error); }
};

export const doctors = async (_req, res, next) => { try { res.json({ users: await User.find({ role: 'DOCTOR', accountStatus: 'ACTIVE' }).select('name walletAddress specialization organization') }); } catch (e) { next(e); } };
export const patients = async (_req, res, next) => { try { res.json({ users: await User.find({ role: 'PATIENT', accountStatus: 'ACTIVE' }).select('name walletAddress') }); } catch (e) { next(e); } };
