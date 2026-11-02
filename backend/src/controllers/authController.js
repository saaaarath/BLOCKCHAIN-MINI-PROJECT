import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { signAccessToken, signRefreshToken } from '../utils/tokens.js';
import { verifyWallet } from '../services/blockchainService.js';

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, walletAddress: user.walletAddress, specialization: user.specialization, organization: user.organization, accountStatus: user.accountStatus });
const response = (user) => ({ user: publicUser(user), accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, walletAddress, specialization, organization } = req.body;
    if (!name || !email || !password || !role || !walletAddress) throw new AppError(400, 'name, email, password, role, and walletAddress are required');
    if (!['PATIENT', 'DOCTOR'].includes(role)) throw new AppError(400, 'Invalid role');
    if (password.length < 12) throw new AppError(400, 'Password must be at least 12 characters');
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role, walletAddress: verifyWallet(walletAddress), specialization, organization });
    res.status(201).json(response(user));
  } catch (error) { next(error.code === 11000 ? new AppError(409, 'Email or wallet address already exists') : error); }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) throw new AppError(401, 'Invalid credentials');
    res.json(response(user));
  } catch (error) { next(error); }
};

export const me = (req, res) => res.json({ user: publicUser(req.user) });
export const logout = (_req, res) => res.status(204).send();
